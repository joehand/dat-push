var events = require('events')
var util = require('util')
var Dat = require('dat-js')
var network = require('peer-network')()
var pump = require('pump')

module.exports = DatPush

function DatPush (opts) {
  if (!(this instanceof DatPush)) return new DatPush(opts)
  if (!opts.dir) throw new Error('Directory required')
  events.EventEmitter.call(this)

  var self = this
  self.dir = opts.dir
  self.dat = Dat({dir: self.dir, discovery: false, watchFiles: false})
  self._replicatingServers = []
}

util.inherits(DatPush, events.EventEmitter)

DatPush.prototype.push = function (key, cb) {
  if (!cb) cb = function (err) { err && self.emit('error', err) }
  if (!key) return cb(new Error('must specify key'))
  // if (self._servers[key]) return Error('?')

  var self = this
  self.datOpen = false
  var serverStatus = {
    replicating: false,
    connected: false
  }
  var archive
  var stream = network.connect(key)

  stream.once('connect', function (err) {
    if (err) return cb(err)
    serverStatus.connected = true
    self.emit('connect', key)
  })

  if (self.datOpen) replicate()
  else {
    self.dat.open(function (err) {
      if (err) return cb(err)
      self.emit('dat-open')
      run()
    })
  }

  function run () {
    archive = self.dat.archive
    self.datOpen = true
    if (self.dat.resume) archive.finalize(replicate)
    else self.dat.share(replicate)
  }

  function replicate () {
    self.emit('replication-ready')
    if (!serverStatus.connected) return stream.once('connect', replicate)

    serverStatus.replicating = true
    self._replicatingServers.push(key)
    self.emit('replicating', key)

    stream.write(archive.key)
    pump(stream, archive.replicate(), stream, function (err) {
      if (err) return cb(err)
    })
    remoteProgress(archive.content)

    function remoteProgress (feed, interval) {
      if (!interval) interval = 200
      var remoteBlocks = 0

      var it = setInterval(function () {
        remoteBlocks = update()
        self.emit('progress', key, remoteBlocks, feed.blocks)
        if (remoteBlocks === feed.blocks) {
          stream.end()
          clearInterval(it)
          self._replicatingServers.splice(self._replicatingServers.indexOf(key), 1)
          self.emit('upload-finished', key)
          return cb(null)
        }
      }, interval)

      function update () {
        var have = 0
        var peer = feed.peers[self._replicatingServers.indexOf(key)] // TODO: less hacky way to get correct peer
        if (!peer) return 0
        for (var j = 0; j < feed.blocks; j++) {
          if (peer.remoteBitfield.get(j)) have++
        }
        return have
      }
    }
  }
}

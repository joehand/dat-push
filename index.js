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
  self._connected = false
  self._replicating = false
}

util.inherits(DatPush, events.EventEmitter)

DatPush.prototype.push = function (key, cb) {
  if (!cb) cb = function (err) { err && self.emit('error', err) }
  if (!key) return cb(new Error('must specify key'))

  var self = this
  var archive
  var stream = self._network = network.connect(key)

  stream.once('connect', function (err) {
    if (err) return cb(err)
    self._connected = true
    self.emit('connect')
  })

  self.dat.open(function (err) {
    if (err) return cb(err)
    run()
  })

  function run () {
    archive = self.dat.archive
    self.emit('dat-open')
    if (self.dat.resume) archive.finalize(replicate)
    else self.dat.share(replicate)
  }

  function replicate () {
    if (!self._connected) return stream.once('connect', replicate)

    self._replicating = true
    self.emit('replicating')

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
        self.emit('progress', remoteBlocks, feed.blocks)
        if (remoteBlocks === feed.blocks) {
          self.emit('upload-finished')
          stream.end()
          clearInterval(it)
          return cb(null)
        }
      }, interval)

      function update () {
        var have = 0
        var peer = feed.peers[0]
        if (!peer) return 0
        for (var j = 0; j < feed.blocks; j++) {
          if (peer.remoteBitfield.get(j)) have++
        }
        return have
      }
    }
  }
}

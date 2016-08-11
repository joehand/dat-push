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
  this.dir = opts.dir
}

util.inherits(DatPush, events.EventEmitter)

DatPush.prototype.push = function (key, cb) {
  if (!key) throw new Error('must specify key')
  if (!cb) cb = function (err) { err && self.emit('error', err) }

  var self = this
  var archive
  var feed
  var stream = self._network = network.connect(key)

  stream.on('connect', function () {
    self.emit('connect')
  })

  if (!self._dat) {
    self._dat = Dat({dir: self.dir, discovery: false, live: false})
    self._dat.on('ready', function (err) {
      if (err) throw err
      if (!self._dat.resume) throw new Error('no .dat found')
      archive = self._dat.archive
      archive.finalize(function () {
        feed = archive.content
        replicate()
      })
    })
  } else {
    archive = self._dat.archive
    feed = archive.content
    replicate()
  }

  function replicate () {
    self.emit('replicating')
    stream.write(self._dat.key)
    pump(stream, archive.replicate(), stream, function (err) {
      if (err) throw err
      console.log('stream done')
    })

    setInterval(function () {
      if (checkComplete()) {
        self.emit('upload-finished')
        stream.end()
        return cb(null)
      }
    }, 1000)

    function checkComplete () {
      var peer = feed.peers[0]
      if (!peer) return false
      for (var j = 0; j < feed.blocks; j++) {
        if (!peer.remoteBitfield.get(j)) return false
      }
      return true
    }
  }
}

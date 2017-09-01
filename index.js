var assert = require('assert')
var dns = require('dns')
var Dat = require('dat-node')
var debug = require('debug')('dat-push')

module.exports = function (datPath, pushTo, cb) {
  assert.equal(typeof datPath, 'string', 'dat-push: string path required')
  if (typeof pushTo === 'function') {
    cb = pushTo
    pushTo = null
  }
  assert.equal(typeof cb, 'function', 'dat-push: callback required')
  debug('dir', datPath)

  if (!pushTo) return push([])

  var whitelist = []
  doLookup()

  function doLookup (cb) {
    var domain = pushTo.pop()
    if (!domain) return push(whitelist)

    debug('dns lookup', domain)
    dns.lookup(domain, function (err, address) {
      if (err) return cb(err)
      whitelist.push(address)
      debug('resolved', domain, 'to', address)
      doLookup()
    })
  }

  function push (whitelist) {
    Dat(datPath, {createIfMissing: false}, function (err, dat) {
      if (err) return cb(err)
      var stats = dat.trackStats()
      var activePeers = 0

      dat.importFiles(function (err) {
        if (err) return cb(err)
      })

      dat.joinNetwork({
        stream: replicate,
        whitelist: whitelist
      }).on('listening', function () {
        debug('joined network')
      }).on('connection', function (conn, info) {
        debug('new connection', info.host)
        activePeers++
      })

      function replicate (peer) {
        var stream = dat.archive.replicate({live: false})
        stream.on('error', function (err) {
          debug('replicate err', err)
          activePeers--
        })
        stream.on('close', function () {
          debug('stream close')
          debug('peer count:', stats.peers)
          activePeers--
          var peers = stats.peers
          if (peers.total === peers.complete) return done()
        })
        return stream
      }

      function done () {
        debug('done()', activePeers)
        if (activePeers > 0) return // TODO: why getting -1?
        var peers = stats.peers
        if (peers.total !== peers.complete) return

        // TODO: check there are no pending connections
        // getting multiple closes
        if (dat._closed) return

        dat.close(cb)
      }
    })
  }
}

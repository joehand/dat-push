var assert = require('assert')
var dns = require('dns')
var Dat = require('dat-node')
var debug = require('debug')('dat-push')

const WANT_TIMEOUT = 5e3

module.exports = function (datPath, pushTo, cb) {
  assert.strictEqual(typeof datPath, 'string', 'dat-push: string path required')
  if (typeof pushTo === 'function') {
    cb = pushTo
    pushTo = null
  }
  assert.strictEqual(typeof cb, 'function', 'dat-push: callback required')
  debug('dir', datPath)

  if (!pushTo) return push([])

  var whitelist = []
  doLookup(push)

  function doLookup (cb) {
    var domain = pushTo.pop()
    if (!domain) return push(whitelist)

    debug('dns lookup', domain)
    dns.lookup(domain, function (err, address) {
      if (err) return cb(err)
      whitelist.push(address)
      debug('resolved', domain, 'to', address)
      doLookup(cb)
    })
  }

  function push (whitelist) {
    Dat(datPath, { createIfMissing: false }, function (err, dat) {
      if (err) return cb(err)
      var stats = dat.trackStats()
      var activePeers = 0

      console.log('Importing newest files...')
      dat.importFiles(function (err) {
        if (err) return cb(err)
      })

      console.log('Joining network...')
      dat.joinNetwork({
        stream: replicate,
        whitelist: whitelist
      }).on('listening', function () {
        console.log('Searching for targets...')
        debug('joined network')
      }).on('connection', function (conn, info) {
        debug('new connection', info.host)
        activePeers++
      })

      function replicate (peer) {
        var stream = dat.archive.replicate({ live: false })
        console.log('Replicating with', peer.host)

        const onClose = () => {
          console.log('Finished replicating with', peer.host)
          debug('stream close')
          debug('peer count:', stats.peers)
          activePeers--
          var peers = stats.peers
          if (peers.total === peers.complete) return done()
        }

        // HACK
        // close the stream if no want messages are received for a period
        // we will assume that means that sync is finished
        // that's not always the case (connection could have just died)
        // see https://github.com/joehand/dat-push/issues/9
        // -prf
        const endStream = () => {
          debug(`no want-msg received in ${WANT_TIMEOUT}ms, closing stream`)
          stream.finalize()
          onClose() // must call this manually, event doesnt emit
        }
        const startTheClock = () => setTimeout(endStream, WANT_TIMEOUT)
        var to = startTheClock()
        stream.on('want', () => {
          clearTimeout(to)
          to = startTheClock()
        })

        stream.on('error', function (err) {
          debug('replicate err', err)
          activePeers--
        })
        stream.on('close', onClose)
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

#!/usr/bin/env node

var args = require('minimist')(process.argv.slice(2), {
  boolean: ['debug']
})

if (!args._[0]) {
  console.error('Usage: dat-push <server-key> --dir=directory')
  console.error('Please specify a <server-key>')
  process.exit(1)
}

var DatPush = require('.')
var logger = require('status-logger')
var chalk = require('chalk')
var prettyBytes = require('pretty-bytes')
var prettyHrtime = require('pretty-hrtime')

var destKeys = args._
var dir = args.dir || process.cwd()
var datPush = DatPush({dir: dir})

var pending = []
var timers = {}
var connections = 0
var longestKey = 0
var datInfo = ['Reading Dat directory...']
var serverInfo = [pendingConnMsg(destKeys.length)]
var progressInfo = []
var log = logger([datInfo, serverInfo, progressInfo], {debug: args.debug})
log.print()
setInterval(function () {
  log.print()
}, 200)

destKeys.forEach(function (serverKey, i) {
  if (serverKey.length > longestKey) longestKey = serverKey.length
  pending.push(serverKey)
  timers[serverKey] = process.hrtime()
  return pushServer(serverKey)
})

function pushServer (serverKey) {
  datPush.push(serverKey, function (err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    pending.splice(pending.indexOf(serverKey), 1)
    if (!pending.length) {
      progressInfo.push('\nPush Complete')
      log.print()
      process.exit(0)
    }
  })
}
datPush.once('dat-open', function () {
  if (!datPush.dat.resume) datInfo[0] = 'No dat in directory, creating a new dat. This could take some time.'
})

datPush.on('connect', function (key) {
  connections++
  var msg = `Connected: ${connections} server${connections > 1 ? 's' : ''}`
  if (destKeys.length > connections) msg += ' | ' + pendingConnMsg(destKeys.length - connections)
  serverInfo[0] = msg
})

datPush.once('replication-ready', function (key) {
  datInfo[0] = 'Pushing Dat'
  datInfo[1] = `  Key: ${datPush.dat.archive.key.toString('hex')}`
  datInfo[2] = `  Size: ${prettyBytes(datPush.dat.archive.content.bytes)}`
  datInfo[3] = '' // padding
})

datPush.on('replicating', function (key) {
  var index = destKeys.indexOf(key)
  progressInfo[index] = chalk.blue.bold(key)
})

datPush.on('progress', function (key, remote, total) {
  var percent = remote / total
  var index = destKeys.indexOf(key)
  var msg = percent === 1 ? chalk.green.bold(key) : chalk.blue.bold(key)
  var spacer = Array(longestKey - key.length + 3).join(' ')
  msg += spacer + progressBar(percent) + ' ' + Math.round(percent * 100) + '%'
  msg += '  ' + prettyHrtime(process.hrtime(timers[key]))
  progressInfo[index] = msg
})

datPush.once('error', function (err) {
  console.error(err)
  process.exit(1)
})

function progressBar (percent) {
  var width = 30
  var cap = '>'
  var ends = ['[', ']']
  var spacer = Array(width).join(' ')
  var progressVal = ''
  var val = Math.round(percent * width)

  if (isFinite(val) && val > 0) {
    progressVal = Array(val).join('=')
    progressVal += cap
  }
  progressVal += spacer
  progressVal = progressVal.substring(0, width)

  if (percent < 1) return ends[0] + chalk.blue(progressVal) + ends[1]
  return ends[0] + chalk.green(progressVal) + ends[1]
}

function pendingConnMsg (val) {
  return `Waiting for connection to ${val} server${val > 1 ? 's' : ''}`
}
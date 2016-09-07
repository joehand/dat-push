#!/usr/bin/env node

var args = require('minimist')(process.argv.slice(2))

if (!args._[0]) {
  console.error('Usage: dat-push <server-key> [directory]\n')
  console.error('Please specify a <server-key>')
  process.exit(1)
}

var DatPush = require('.')
var logger = require('status-logger')
var chalk = require('chalk')

var serverKey = args._[0]
var dir = args._[1] || process.cwd()
var datPush = DatPush({dir: dir})

var lines = [
  'Waiting for connection to dat-archive server...'
]
var log = logger([lines])
log.print()
setInterval(function () {
  log.print()
}, 200)

datPush.push(serverKey, function (err) {
  if (err) throw err
  log.groups[0] = [
    `Uploaded to server: ${serverKey}`,
    `Dat Pushed:`,
    `  Directory: ${datPush.dat.dir}`,
    `  Key: ${datPush.dat.archive.key.toString('hex')}`
  ]
  log.print()
  process.exit(0)
})

datPush.on('connect', function () {
  lines[0] = 'Connected to Server: ' + serverKey
})

datPush.on('dat-open', function () {
  if (datPush.dat.resume) lines.push(`Pushing Dat: ${datPush.dat.key.toString('hex')}`)
  else lines.push('No dat in directory, creating a new dat. This could take some time.')
})

datPush.on('replicating', function () {
  lines.push('\nUploading Data', '') // add extra line for progress bar
})

datPush.on('progress', function (remote, total) {
  var percent = remote/total
  lines[lines.length - 1] = progressBar(percent) + ' ' + Math.round(percent * 100) + '%'
})

datPush.on('error', function (err) {
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

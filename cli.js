#!/usr/bin/env node

var DatPush = require('.')
var differ = require('ansi-diff-stream')
var chalk = require('chalk')

var args = require('minimist')(process.argv.slice(2))

if (!args._[0]) {
  console.error('Usage: dat-push <server-key> [directory]\n')
  console.error('Please specify a <server-key>')
  process.exit(1)
}

var key = args._[0]
var dir = args._[1] || process.cwd()
var datPush = DatPush({dir: dir})
var diff = differ()
var lines = [
  'Waiting for Connection...'
]
var progress = ''

datPush.push(key, function (err) {
  if (err) throw err
  lines = ['All done. Bye Bye.']
  diff.write(print())
  process.exit(0)
})

function print() {
  if (!lines.length) return ''
  return lines.join('\n') + '\n' + progress
}

diff.write(print())
setInterval(function () {
  diff.write(print())
}, 500)
diff.pipe(process.stdout)

datPush.on('connect', function () {
  lines[0] = 'Connected to Server: ' + key
  if (datPush._replicating) lines[1] = 'Uploading Data' // TODO: not this
})

datPush.on('new-dat', function () {
  progress = 'No dat here, creating a new dat' // Hacky message overwrite
})

datPush.on('replicating', function () {
  if (datPush._connected) lines.push('Uploading Data')
  else lines.push('')
})

datPush.on('progress', function (remote, total) {
  var percent = remote/total
  if (datPush._connected) progress = progressBar(percent) + ' ' + Math.round(percent * 100) + '%'
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

#!/usr/bin/env node

var DatPush = require('.')

var datPush = DatPush({dir: process.cwd()})
var key = process.argv[2]

datPush.push(key, function (err) {
  process.exit(0)
})
datPush.on('connect', function () {
  console.log('connected to server')
})
datPush.on('replicating', function () {
  console.log('replicating')
})
datPush.on('upload-finished', function () {
  console.log('upload finished')
})
#!/usr/bin/env node

var args = require('minimist')(process.argv.slice(2), {
  default: {
    dir: process.cwd()
  }
})

var DatPush = require('.')
DatPush(args.dir, args._, function (err) {
  if (err) throw err
  console.log('push done, maybe?')
})

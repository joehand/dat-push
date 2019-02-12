#!/usr/bin/env node

var args = require('minimist')(process.argv.slice(2), {
  default: {
    dir: process.cwd()
  }
})

if (!args._.length) {
  console.error('Usage:')
  console.error('  dat-push <dat-directory> [<server>]')
  process.exit(1)
}

var DatPush = require('.')
DatPush(args.dir, args._, function (err) {
  if (err) throw err
})

# dat-push

**WIP** One-time push via Dat. The other side of [dat-download](https://github.com/joehand/dat-download), kind of?

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

## Example

```js
var datPush = require('dat-push')

datPush(process.cwd(), 'hashbase.io', function (err) {
    if (err) throw err
    console.log('done pushing, maybe? thanks')
})
```

## CLI

```
npm install -g dat-push

dat-push ./existing/dat-dir hashbase.io
```

## License

[MIT](LICENSE.md)

[npm-image]: https://img.shields.io/npm/v/dat-download.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/dat-download
[travis-image]: https://img.shields.io/travis/joehand/dat-download.svg?style=flat-square
[travis-url]: https://travis-ci.org/joehand/dat-download
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

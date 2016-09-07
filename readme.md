# Dat Push

Push a Dat to a server running a [dat-archiver](https://github.com/maxogden/dat-archiver) via [peer-network](https://github.com/mafintosh/peer-network). Dat Push is for one-time pushes to an archive server and does not do live syncing.

## Installation

```
npm install -g dat-push
```

## Usage

```
dat-push <server-key> [directory]
```

* Run a `dat-archiver` server and copy the server key
* Run `dat-push <your-server-key> [directory]` (optionally specify directory, or push current directory)
* Files are sent to your dat-archiver server!
* `dat-push` will exit when your server received all the files.

## API

`dat-push` can also be used in other node modules to push Dats. See `cli.js` for example usage.

### `var datPush = DatPush(opts)`

Options:

```js
{
  dir: '/data', // directory to push, required
}
```

### `datPush.push(serverKey, [cb])`

Push your directory to dat-archiver sever with key `serverKey`. Callback when finished pushing.

### `datPush.once('connect')`

Connected to `dat-archiver` server.

### `datPush.once('dat-open')`

Dat folder ready to push to archiver. `datPush.dat` is populated so you can check if its a new dat (`datPush.dat.resume`) or get the key (`datPush.dat.archive.key`).

### `datPush.once('replicating')`

Replication to `dat-archiver` server started.

### `datPush.on('progress', remote, total)`

Block(s) uploaded to remote server. `remote / total` will give you % uploaded.

### `datPush.once('upload-finished')`

Upload is finished. Emitted same time as callback is called.

### `datPush.dat`

[dat-js](https://github.com/joehand/dat-js) instance of Dat folder.

## License

MIT

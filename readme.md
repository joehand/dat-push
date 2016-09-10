# Dat Push

Push files, via Dat, to a server running a [dat-archiver](https://github.com/maxogden/dat-archiver) or [dat-publish](https://github.com/joehand/dat-publish). Dat Push will send the files to your server over peer to peer networks.

Dat push (+ a compatible server) can be used for data publishing, file backup, or website deployment.

```
dat-push <server-key> --dir=[directory]
```

### Features

* **Push to Multiple Servers**: Add more server keys to push to as many servers as you like. Redundancy!
* **Fast pushes**: After you push the first time, dat-push will only send the data that has changed. Speed!
* **Peer to Peer**: Data is sent encrypted over peer to peer networks (not using http). Data is sent directly between you and your servers. Networks!
* **Instant Publishing**: Combine dat-push with [dat-publish](https://github.com/joehand/dat-publish) to instantly publish your data or files to http and/or Dat networks. Sharing!

## Installation

```
npm install -g dat-push
```

## Usage

```
dat-push <server-key> <server-key> --dir=[directory]
```

* Run a `dat-archiver` or `dat-publish` server and copy the server key
* Run `dat-push <your-server-key>` (this will push current directory)
* Files are sent to your dat-archiver server!
* `dat-push` will exit when your server received all the files.

Dat push uses [peer-network](https://github.com/mafintosh/peer-network) to connect to servers. (TODO: Notes about security).

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

### `datPush.once('connect', key)`

Connected to `dat-archiver` server.

### `datPush.once('dat-open')`

Dat folder ready to push to archiver. `datPush.dat` is populated so you can check if its a new dat (`datPush.dat.resume`) or get the key (`datPush.dat.archive.key`).

### `datPush.once('replication-ready', key)`

About to replicate. `datPush.dat.archive` is finalized at this point. File size, or other metrics, available.

### `datPush.once('replicating', key)`

Replication to `dat-archiver` server started.

### `datPush.on('progress', key, remote, total)`

Block(s) uploaded to remote server. `remote / total` will give you % uploaded.

### `datPush.once('upload-finished', key)`

Upload is finished. Emitted same time as callback is called.

### `datPush.dat`

[dat-js](https://github.com/joehand/dat-js) instance of Dat folder.

## License

MIT

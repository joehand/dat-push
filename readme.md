# Dat Push

Push files to a server running a [dat-archiver](https://github.com/maxogden/dat-archiver). 

## Usage

`dat-push` requires you run a `dat-archiver` server.

### Install

```bash
npm install -g dat-push
```

### Use

```bash
dat-push <server-key> [directory]
```

* Run a `dat-archiver` server and copy the server key
* Run `dat-push <server-key>` (optionally specify directory to push, or push current directory)
* Files are sent to your server!

## License

MIT

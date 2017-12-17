'use strict'

const Net = require('net')
const Http = require('http')
const EE = require('events')
const Url = require('url')

class Server extends EE {
  constructor (options) {
    super(options)

    this.data = []
    this.reconnect = options.reconnect
    this.storage = options.storage
    this.net = options.net
    this.ip = options.server.ip
    this.port = options.server.port
    this.start()
  }

  start () {
    this.server = Http.createServer()
    this.server.listen(this.port, this.ip)
    this.server
      .on('error', () => { this.emit('serverError', 'Server error') })
      .on('clientError', (e, socket) => { this.handleClientError(e, socket) })
      .on('request', (req, res) => { this.requestHandler(req, res) })
  }

  requestHandler (req, res) {
    // const parsedUrl =
    this.logTime = query.time
    this.logType = query.type

    this.socketConnect()
  }

  socketConnect () {
    this.socket = new Net.Socket()
    this.socket
      .on('error', (err) => {
        if (this.reconnect) {
          return setTimeout(() => {
            this.socket.connect()
          }, 1000)
        }
        this.emit('socketError', err)
      })
      .on('data', (chunk) => { this.data.push(chunk) })
      .on('end', () => { this.messageHandler() })
      .on('connect', () => { this.sendMessage() })

      .connect(this.net, () => {})
  }

  sendMessage () {
    this.socket.write(`${this.logTime}***${this.logType}`)
  }

  messageHandler () {
    const message = this.data.join('') // 0 - error end, 1 - success end
  }

  handleClientError (e, socket) {
    this.emit('serverError', e)
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  }

}

module.exports = Server
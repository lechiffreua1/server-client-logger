'use strict'

const Net = require('net')
const Http = require('http')
const EE = require('events')
const Url = require('url')
const AS = require('../aerospike')

class Server extends EE {
  constructor (options) { // TODO error handling in one place
    super(options)

    this.dataReady = false
    this.res = null
    this.reconnect = options.reconnect
    this.message = options.message
    this.delimiters = options.delimiters
    this.netPort = options.net.port
    this.ip = options.server.ip
    this.port = options.server.port
    this.as = new AS() // TODO aerospike model

    this.on('loggerError', (e) => { console.error(e) })
    this.on('badRequest', this.badRequest)

    this.start()
  }

  start () {
    this.server = Http.createServer()
    this.server.listen(this.port, this.ip)
    this.server
      .on('error', () => { this.emit('loggerError', 'Server error') })
      .on('clientError', (e, socket) => { this.handleClientError(e, socket) })
      .on('listening', () => { console.log('http listening') })
      .on('request', (req, res) => { this.requestHandler(req, res) })
  }

  requestHandler (req, res) {
    this.res = res

    if (req.method !== 'GET') {
      return this.emit('badRequest', `Unknown method - ${req.method}`)
    }

    try {
      const parsedUrl = Url.parse(req.url, true)
      this.query = parsedUrl.query
      this.path = parsedUrl.pathname
    }
    catch (e) {
      this.emit('loggerError', e)
      return this.emit('badRequest', `Cannot parse url - ${req.url}`)
    }

    switch (this.path) {
      case '/start':
        this.startLogger()
        break;

      case '/logs':
        this.getLoggerData()
        break;

      default:
        this.emit('badRequest', `Unknown path - ${this.path}`)
    }
  }

  startLogger () {
    const { res, query } = this

    res.statusCode = 200
    res.end('ok')

    this.storage = query.storage
    this.netIp = query.netIp
    this.params = JSON.stringify(query)

    this.socketConnect()
  }

  getLoggerData () { // TODO get aerospike records
    const { res } = this
    if (!this.dataReady) {
      res.statusCode = 200
      res.write('Logger data is not ready!')
      return res.end()
    }

    res.statusCode = 200
    res.write('Data is ready')
    res.end()
  }

  socketConnect () {
    this.socket = new Net.Socket()
    this.socket.setEncoding('utf8')
    this.socket
      .on('error', (e) => {
        this.emit('loggerError', e)

        if (this.reconnect) {
          return setTimeout(() => {
            this.socket.connect()
          }, 1000)
        }
      })
      .on('data', (data) => { this.messageHandler(data) })
      .on('end', () => {})
      .on('connect', () => { this.sendMessage() })

      .connect(this.netPort, this.netIp)
  }

  sendMessage () {
    const { middleDelim, endDelim } = this.delimiters
    const dataToWrite = `${this.message}${middleDelim}${this.params}${endDelim}`
    this.socket.write(dataToWrite)
  }

  messageHandler (data) {  // 0 - error end, 1 - success end
    if (data === '0') {
      this.emit('loggerError', 'Logger error get logs')
      this.dataReady = false
    }
    else {
      console.log('Logger data is ready')
      this.dataReady = true
    }
  }

  handleClientError (e, socket) {
    this.emit('loggerError', e)
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  }

  badRequest (message) {
    const { res } = this
    res.statusCode = 400
    res.write(message)
    res.end()
  }

}

module.exports = Server

// TODO only for tests

const s = new Server({
  reconnect: false,
  message: 'logger',
  delimiters: {
    middleDelim: '***',
    endDelim: '@@@'
  },
  net: {
    port: 3300
  },
  server: {
    ip: '127.0.0.1',
    port: 80
  }
})
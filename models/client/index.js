'use strict'

const EE = require('events')

class CLient extends EE {
  constructor (options) {
    super()

  }

  start (params) {
    let loggerParams = null
    try {
      loggerParams = JSON.parse(params)
    }
    catch (e) {
      return console.error('logger client', e)
    }

  }

}

module.exports = Client
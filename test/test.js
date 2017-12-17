const Net = require('net')

const server = Net.createServer()
server.on('error', (e) => { console.error(e) })
server.on('listening', () => { console.log('net server is listening') })
server.on('connection', (socket) => {
  socket.setEncoding('utf8')
  socket.on('data', (data) => {
    console.log(data)
    setTimeout(() => {
      socket.write('1')
      socket.end()
    }, 10000)
  })
  socket.on('end', () => {})
})
server.listen(3300)
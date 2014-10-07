var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , posy = require('../../index.js')
  , sync = new posy.Server(io)

app.listen(8000);

function handler (req, res) {
  console.log("Client requested: ", req.url);
  if(req.url =='/') req.url = '/index.html';
  fs.readFile(__dirname + req.url,
  function (err, data) {
    if (err) {
      res.writeHead(404);
      return res.end('Could not find '+req.url);
    }
    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});


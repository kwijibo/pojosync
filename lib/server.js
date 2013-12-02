var Store = require('./store.js');
var Server = function(app){  
  var io = require('socket.io').listen(app);
  var DStore = new Store();
  io.sockets.on('connection', function (socket) {
    socket.on('put', function (resource) {
      socket.broadcast.emit('put', resource);
      return DStore.put(resource);
    });
    socket.on('delete', function (resource) {
      socket.broadcast.emit('delete', resource);
      return DStore.delete(resource);
    });
    socket.on('list', function(params){
      return DStore.list(params);
    });
  });
  
};

module.exports = Server;

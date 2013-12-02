require('./store.js');
var Server = function(app){  
  var io = require('socket.io').listen(app);
  var Store = new Store();
  io.sockets.on('connection', function (socket) {
    socket.on('put', function (resource) {
      socket.broadcast.emit('put', resource);
      return Store.put(resource);
    });
    socket.on('delete', function (resource) {
      socket.broadcast.emit('delete', resource);
      return Store.delete(resource);
    });
    socket.on('list', function(params){
      return Store.list(params);
    });
  });
  
};


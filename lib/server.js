var Store = require('./store.js');
var Server = function(io){  
  var self = this;
  self.Store = new Store();
  io.sockets.on('connection', function (socket) {
    console.log("client connected");
    socket.on('put', function (resource, callback) {
      console.log("put", resource);
      socket.broadcast.emit('put', resource);
      callback(self.Store.put(resource));
    });
    socket.on('delete', function (resource, callback) {
      socket.broadcast.emit('delete', resource);
      callback(self.Store.delete(resource));
    });
    socket.on('list', function(params, callback){
      var data = self.Store.list(params);
      console.log("listing ", params, data);
      callback(data);
    });
  });
  
};

module.exports = Server;

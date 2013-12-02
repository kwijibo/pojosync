var fs = require('fs');
var Store = require('./store.js');
var Server = function(io){  
  var self = this;
  self.Store = new Store();
  self.readStore();
  io.sockets.on('connection', function (socket) {
    console.log("client connected");
    socket.on('put', function (resource, callback) {
      console.log("put", resource);
      socket.broadcast.emit('put', resource);
      callback(self.Store.put(resource));
      self.persistStore();
    });
    socket.on('list', function(params, callback){
      var data = self.Store.list(params);
      console.log("listing ", params, data);
      callback(data);
    });
  });
};

Server.prototype.readStore = function(){
  var store_str = fs.readFileSync('livemodel.data.json', {flag: 'a+'});
  if(store_str.length){
    var store = JSON.parse(store_str);
    this.Store.index = store.index;
    this.Store.typeCount = store.typeCount;
  }
};

Server.prototype.persistStore = function(){
  fs.writeFile('livemodel.data.json', JSON.stringify(this.Store),
  function (err) {
    if (err) {
      throw err;
    }
  });
};

module.exports = Server;

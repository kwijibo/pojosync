var fs = require('fs');
var Store = require('./store.js');
var Server = function(io){  
  var self = this;
  self.Store = new Store();
  self.readStore();
  io.sockets.on('connection', function (socket) {
    console.log("client connected");
    socket.on('put', function (data, callback) {
      console.log("Server.put", data);
      socket.broadcast.emit('put', data);
      self.Store.unflattenAndPut(data);
      callback();
      self.persistStore();
    });
    socket.on('list', function(params, callback){
      var data = self.Store.list(params);
      console.log("listing ", params, data);
      var ids = data.map(function(r){ return r.id });
      var index = self.Store.flatten(data);
      callback({ids: ids, index: index});
    });
  });
};

Server.prototype.readStore = function(){
  var store_str = fs.readFileSync('livemodel.data.json', {flag: 'a+'});
  if(store_str.length){
    var store = JSON.parse(store_str);
    this.Store.unflattenAndPut(store);
  }
};

Server.prototype.persistStore = function(){
  fs.writeFile('livemodel.data.json', JSON.stringify(this.Store.flattenStore()),
  function (err) {
    if (err) {
      throw err;
    }
  });
};

module.exports = Server;

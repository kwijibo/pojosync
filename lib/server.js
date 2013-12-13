var fs = require('fs');
var Store = require('./store.js');
var Client = require('./client.js');
var Server = function(io){  
  var self = this;
  self.Store = new Store();
  self.lists = [];
  self.readStore();
  self.io = io;
  io.sockets.on('connection', function (socket) {
    console.log("Client connected");
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
      var ids = data.map(function(r){return r.id});
      var index = self.Store.flatten(data);
      callback({ids: ids, index: index});
    });
  });
};

Server.prototype.put = function(resource){
   var id_ed_resource = this.Store.put(resource);
   this.io.sockets.emit('put', this.Store.flatten(id_ed_resource));
   this.persistStore();
   return id_ed_resource;
};

Server.prototype.list = function(query){
  return this.Store.list(query);
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

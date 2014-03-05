var fs = require('fs');
var Store = require('./store.js');
var Client = require('./client.js');
var Server = function(io){  
  var self = this;
  self.filters = {};
  self.Store = new Store();
  self.lists = [];
  self.readStore();
  self.io = io;

  function doPut(socket,data,callback){
    socket.broadcast.emit('put', data);
    self.Store.unflattenAndPut(data);
    self.persistStore();
    callback();
  }

  io.sockets.on('connection', function (socket) {
    socket.on('put', function (data, callback) {
      if(self.filters.put){
        var success = function(){ return doPut(socket,data,callback); };
        var err = function(){ if(callback) callback(false); };
        self.filters.put(data, success, err);
      } else {
        doPut(socket,data,callback);
      }
    });
    socket.on('list', function(params, callback){
      var data = self.Store.list(params);
      var ids = data.map(function(r){return r.id});
      var index = self.Store.flatten(data);
      callback({ids: ids, index: index});
    });
  });
};



Server.prototype.registerFilter = function(action, func){
  this.filters[action] = func;
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
  var store_str = fs.readFileSync('pojosync.data.json', {flag: 'a+'});
  if(store_str.length){
    var store = JSON.parse(store_str);
    this.Store.unflattenAndPut(store);
  }
};

Server.prototype.persistStore = function(){
  fs.writeFileSync('pojosync.data.json', JSON.stringify(this.Store.flattenStore()));
};

module.exports = Server;

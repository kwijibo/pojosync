var fs = require('fs');
var Store = require('./store.js');
var Client = require('./client.js');
var Utils = require('./utils.js');
var ID_FIELD = Utils.ID_FIELD;

  function Server(io){  
    var self = this;
    var server = self;

    self.list_filters = [];
    self.put_filters = [];
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

    function createFlattenCallback(callback){
      return function(data){
        var ids = data.map(function(r){return r[ID_FIELD]});
        var index = self.Store.flatten(data);
        callback({ids: ids, index: index});
      }
    }

    io.sockets.on('connection', function (socket) {
      socket.on('put', function (data, callback) {
        var putFilter = self.getMatchingPutFilter(data);
        if(putFilter){
          var success = function(commit){  return commit? doPut(socket,data,callback) : false; };
          putFilter(server, data, success);
        } else {
          doPut(socket,data,callback);
        }
      });
      socket.on('list', function(params, callback){
        var listFilter = self.getMatchingListFilter(params);
        var flattenThenCall = createFlattenCallback(callback);
        if(listFilter){
          listFilter(server,socket,params,flattenThenCall);
        } else { 
          var data = self.Store.list(params);
          flattenThenCall(data);
        }
    });
  });
}

Server.prototype._getMatchingFilter = function(data, filters){
  var len = filters.length;
  for(var i = 0; i < len; i++){
    var filter = filters[i];
    if(this.Store.matchesFilter(data,filter.matchObject)){
      return filter.filterFunc;
    }
  }
  return null;
};

Server.prototype.getMatchingListFilter = function(data){
  return  this._getMatchingFilter(data, this.list_filters);
};
Server.prototype.getMatchingPutFilter = function(data){
  return this._getMatchingFilter(data, this.put_filters);
};

Server.prototype.registerPutFilter = function(matchObject, func){
  this.put_filters.push({match: matchObject, filterFunc: func});
};
Server.prototype.registerListFilter = function(matchObject, func){
  this.list_filters.push({match: matchObject, filterFunc: func});
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

var Store = require('./store.js');
var Utils = require('./utils.js');

var Client = function(io){
  var self = this;
  self.lists = [];
  self.socket = io.connect();
  self.Store = new Store();
  self.socket.on('put', function (data) {
    for(var id in data){
      var resource = data[id];
      if(!Utils.resourceIsEmpty(resource)){
        self.Store.unflatten(resource, data);
        self.Store.put(resource);
        self.addToLists(resource);
      } else { 
        self.Store.delete(resource);
        self.removeFromLists(resource);
      }
    }
    self.callSocketCallbacks(data);
  });
  self.socketCallbacks = [];
};

Client.prototype.list = function(params, callback){
  var self = this;
  var list = {filter: params, contents: [] };
  self.lists.push(list);
  self.socket.emit('list', params, function(data){
    console.log("list returns", data);
     self.Store.unflattenAndMerge(data.index);
     for (var i = 0; i < data.ids.length; i++) {
       var id = data.ids[i];
       var resource = self.Store.get(id);
       if(list.contents.indexOf(resource)==-1){
         list.contents.push(resource);
       }
     };
     self.callSocketCallbacks();
     if(callback){
       callback(list.contents);
     }
  });
  return list.contents;
};

Client.prototype.put = function(resource, callback){ 
  var self = this;
  self.Store.put(resource);
  var data = self.Store.flatten(resource);
  for(var id in data){
    self.addToLists(data[id]);
  }
  this.socket.emit('put', data, function(data){
    if(callback){
      callback(data);
    }
    self.callSocketCallbacks(data);
  }); 
  return resource;
};
Client.prototype.delete = function(data, callback){ 
  this.put({id: data.id }, callback);
  this.removeFromLists(data);
};

Client.prototype.addToLists = function(resource){
  var self = this;
  for (var i = 0; i < this.lists.length; i++) {
    var list = this.lists[i];
    var ids = list.contents.map(function(r){ return r.id; });
    if( self.Store.matchesFilter(resource, list.filter) 
        && (ids.indexOf(resource.id) < 0) 
      ){
      list.contents.unshift(resource);
    }
  };
};

Client.prototype.removeFromLists = function(resource){
  var self = this;
  for (var i = 0; i < self.lists.length; i++) {
    var list = self.lists[i];
    for(var j = 0; j < list.contents.length; j++){
      if(list.contents[j].id==resource.id){
        list.contents.splice(j,1);
      }
    }
  };
};

Client.prototype.addSocketCallback = function(fun){
  if(this.socketCallbacks.indexOf(fun) == -1){
    this.socketCallbacks.push(fun);
  }
};

Client.prototype.removeSocketCallback = function(fun){
  var index = this.socketCallbacks.indexOf(fun);
  if(index > -1){
    this.socketCallbacks.splice(index,1);
  }
};

Client.prototype.callSocketCallbacks = function(data){
  for(var i = 0 ; i < this.socketCallbacks.length; i++){
    this.socketCallbacks[i](data);
  }
};

module.exports = Client;

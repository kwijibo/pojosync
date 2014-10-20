var Store = require('./store.js');
var Utils = require('./utils.js');
var ID_FIELD = Utils.ID_FIELD;

var Client = function(socket){
  var self = this;
  self.lists = [];
  try {
    if(!socket){
      var socket = io.connect();
    }
  } catch (e){
    throw Error("socket.io library is required, with a io global variable.");
  }
  self.socket = socket;
  self.Store = new Store();
  self.socket.on('put', function(d){ self.receivePut(d)});
  self.socketCallbacks = [];
};

Client.prototype.receivePut = function(data){
  var self = this;
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
};

Client.prototype._getMatchingList = function(params){
  for(var i = 0; i < this.lists.length; i++){
    var list = this.lists[i];
    if(Utils.objectsEquivalent(params,list.filter)){
      return list.contents;
    }
  }
  return false;
};

Client.prototype.list = function(params, callback){
  var self = this;
  //check list from cache
  var existingList = self._getMatchingList(params);
  if(existingList){
    return existingList;
  }

  var list = {filter: params, contents: self.Store.list(params) };
  self.lists.push(list);
  self.socket.emit('list', params, function(data){
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
    self.addToLists(self.Store.get(id));
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
  this.put({id: data[ID_FIELD] }, callback);
  this.removeFromLists(data);
};

Client.prototype.addToLists = function(resource){
  var self = this;
  for (var i = 0; i < this.lists.length; i++) {
    var list = this.lists[i];
    var ids = list.contents.map(function(r){ return r[ID_FIELD]; });
    if( self.Store.matchesFilter(resource, list.filter) 
        && (ids.indexOf(resource[ID_FIELD]) < 0) 
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
      if(list.contents[j][ID_FIELD]==resource[ID_FIELD]){
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

var Store = require('./store.js');
var Utils = require('./utils.js');
var ID_FIELD = Utils.ID_FIELD;
var Changeset = require('./changeset.js');

var Client = function(socket){
  var self = this;
  self.lists = [];
  try {
    if(!socket){
      var socket = io.connect();
    }
  } catch (e){
    throw Error("socket.io library is required, with an io global variable.\n Or pass a socket.io socket into the constructor");
  }

  self.socket = socket;
  self.AfterStore = new Store();
  self.BeforeStore = new Store(); //for diffing against

  self.socket.on('changeset', function(cs){ 
    self.receiveChangeset(cs);
  });
  self.socketCallbacks = [];
};

Client.prototype._maintainLists = function(cs){
  var self = this;
  function isLastOne(val,index,arr){ return index == arr.lastIndexOf(val);}
  function getSubject(change){ return change.s }
  function applyResourceToLists(s){
    var res = self.AfterStore.get(s);
    Utils.resourceIsEmpty(res)? self.removeFromLists(res) : self.addToLists(res);
  }
  cs.map(getSubject)
  .filter(isLastOne)
  .forEach(applyResourceToLists);
  return;
};

Client.prototype.receiveChangeset = function(cs){
  var self = this;
  self.AfterStore.applyChangeset(cs);
  self.BeforeStore.applyChangeset(cs);
  self._maintainLists(cs);
  self.callSocketCallbacks(cs);
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

  var list = {filter: params, contents: self.BeforeStore.list(params) };
  self.lists.push(list);
  self.socket.emit('list', params, function(data){
    self.receiveChangeset(data.triples);
     for (var i = 0; i < data.subjects.length; i++) {
       var id = data.subjects[i];
       var resource = self.BeforeStore.get(id);
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
  var after = resource;
  var before = self.BeforeStore.get(resource[ID_FIELD]);
  var changeset  = Changeset(before,after);
  self.receiveChangeset(changeset);
  //self.AfterStore.applyChangeset(changeset);
  //self.BeforeStore.applyChangeset(changeset);
  //for(var i =0;i<changeset.length;i++){
    //var id = changeset[i].s;
    //if(changeset[i].action=='addition'){
      //self.addToLists(self.BeforeStore.get(id));
    //}
  //}
  self.socket.emit('changeset', changeset, callback);
  return resource;
};
Client.prototype.delete = function(data, callback){ 
  var resource = {};
  resource[ID_FIELD] = data[ID_FIELD];
  this.put(resource, callback);
  this.removeFromLists(data);
};

Client.prototype.addToLists = function(resource){
  var self = this;
  for (var i = 0; i < this.lists.length; i++) {
    var list = this.lists[i];
    var ids = list.contents.map(function(r){ return r[ID_FIELD]; });
    if( Utils.matchesFilter(resource, list.filter) 
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

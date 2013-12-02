var Store = require('./store.js');

var Client = function(){
  var self = this;
  self.lists = [];
  self.socket = io.connect('http://localhost');
  self.Store = new Store();
  self.socket.on('put', function (data) {
    if(!self.resourceIsEmpty(data)){
      self.Store.put(data);
      self.addToLists(data);
    } else { 
      self.Store.delete(data);
      self.removeFromLists(data);
    }
  });
};

Client.prototype.list = function(params){
  var self = this;
  var list = {filter: params, contents: [] };
  self.lists.push(list);
  self.socket.emit('list', params, function(data){
     for (var i = 0; i < data.length; i++) {
       self.Store.put(data[i]);
       list.contents.push(data[i]);
     };
  });
  return list.contents;
};

Client.prototype.put = function(data, callback){ 
  var self = this;
  this.socket.emit('put', data, function(data){
    self.Store.put(data);
    self.addToLists(data);
    if(callback){
      callback(data);
    }
  }); 
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

Client.prototype.resourceIsEmpty = function(resource){
  var keys = Object.keys(resource);
  return keys.length==1 && keys[0]='id';
};

module.exports = Client;

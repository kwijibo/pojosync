var Store = require('./store.js');

var Client = function(){
  var self = this;
  self.lists = [];
  self.socket = io.connect('http://localhost');
  self.Store = new Store();
  self.socket.on('put', function (data) {
    self.Store.put(data);
    self.addToLists(data);
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
  for (var i = 0; i < this.lists.length; i++) {
    var list = this.lists[i];
    list.contents = list.contents.filter(function(r){ return r.id != resource.id; });
  };
};

module.exports = Client;

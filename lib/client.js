var Store = require('./store.js');

var SimplePromise = function(){};
SimplePromise.prototype.then = function(callback){ this.thenCallback = callback; };
SimplePromise.prototype.do = function(args){
  this.thenCallback.apply(this, args);
};

var Client = function(){
  var self = this;
  self.socket = io.connect('http://localhost');
  self.Store = new Store();
  self.socket.on('put', function (data) {
    self.Store.put(data);
  });
  self.socket.on('delete', function (data) {
    self.Store.delete(data);
  });
};

Client.prototype.list = function(params){
  var self = this;
  var promise = new SimplePromise();
  self.socket.emit('list', params, function(data){
   console.log(data);
   for (var i = 0; i < data.length; i++) {
     self.Store.put(data[i]);
   };
   promise.do(data);
  });
  return promise;
};

Client.prototype.put = function(data, callback){ 
  var self = this;
  this.socket.emit('put', data, function(data){
    self.Store.put(data);
  }); 
  
};
Client.prototype.delete = function(data, callback){ 
  this.socket.emit('delete', data, callback); 
};

module.exports = Client;

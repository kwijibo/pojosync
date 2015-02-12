module.exports = {
  Client : require('./lib/client.js'),
  Server : require('./lib/server.js'),
  Store  : require('./lib/store.js'),
  ServerStore  : require('./lib/serverstore.js'),
  Utils  : require('./lib/utils.js') ,
  makeTestClient : function(){
    var jsonify = function(ev, a){ return JSON.stringify(a)};
    var fun = function(){ return { on: fun, emit: jsonify } };
    return new this.Client(fun()); 
  }
};

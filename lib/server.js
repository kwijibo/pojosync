var fs = require('fs');
var ServerStore = require('./serverstore.js');
var Client = require('./client.js');
var Utils = require('./utils.js');
var when = require('when');

var ID_FIELD = Utils.ID_FIELD;

  function Server(io){  
    var self = this;
    var server = self;

    self.list_filters = [];
    self.put_filters = [];
    self.Store = new ServerStore();
    self.lists = [];
    self.io = io;

    io.sockets.on('connection', function (socket) {
      socket.on('changeset', function(changes, callback){
        self.Store.applyChangeset(changes).then(callback);
      });
      socket.on('list', function(params, callback){
        var listFilters = self.getMatchingListFilters(params);
        if(listFilters.length){
          listFilters[0]({server: server,socket: socket, params: params}, callback);
        } else { 
          self.Store.list(params).then(callback);
        }
      });
  });
}

Server.prototype._getMatchingFilters = function(data, filters){
  var matches = [];
  var len = filters.length;
  for(var i = 0; i < len; i++){
    var filter = filters[i];
    if(Utils.matchesFilter(data,filter.match)){
      matches.push(filter.filterFunc);
    }
  }
  return matches;
};

Server.prototype.getMatchingListFilters = function(data){
  return  this._getMatchingFilters(data, this.list_filters);
};
Server.prototype.getMatchingPutFilters = function(data){
  return this._getMatchingFilters(data, this.put_filters);
};

Server.prototype.registerPutFilter = function(matchObject, func){
  this.put_filters.push({match: matchObject, filterFunc: func});
};
Server.prototype.registerListFilter = function(matchObject, func){
  this.list_filters.push({match: matchObject, filterFunc: func});
};

Server.prototype.list = function(query){
  return this.Store.list(query);
};

module.exports = Server;

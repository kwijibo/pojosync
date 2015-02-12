var Utils = require('../lib/utils.js');
var ID_FIELD = Utils.ID_FIELD;
var live = require('../index.js');

var Socket = function(){
  var self = this;
  this.events = {};
  this.peers = [];
  this.id = 'default'
  this.broadcast = {emit: function(ev,data,callback){
    for(var i = 0; i < clientIO.clients.length; i++){
      var client = clientIO.clients[i];
      if(client!=self){
        client.fire(ev,data,callback);
      }
    }
  }};
  this.on = function(ev, callback){
    self.events[ev] = callback;
  };
  this.emit = function(ev, data, callback){
    for (var i = 0; i < self.peers.length; i++) {
      var func = self.peers[i].events[ev];
      if(func) func(data, callback);
    };
  };
  this.fire = function(ev,data,callback){
    self.events[ev](data,callback);
  };
  this.addPeer = function(p){
    self.peers.push(p);
  }
};
var serverSocket = new Socket();


var Server, ClientA, ClientB;



describe("Socket Interaction", function(){
  beforeEach(function(){
   serverIO = {
      sockets: serverSocket
    };
  clientIO = {
      clients : [],
      connect: function(){
        var serversock = new Socket();
        var clientsock = new Socket();
        clientsock.addPeer(serversock);
        clientsock.id = 'client';
        serversock.id = 'server';
        serversock.addPeer(clientsock);
        serverIO.sockets.fire('connection', serversock, function(){});
        clientIO.clients.push(clientsock);
        return clientsock;
  }
};
    Server = new live.Server(serverIO);
    ClientA = new live.Client(clientIO.connect());
    ClientB = new live.Client(clientIO.connect());
  });

  xdescribe(".registerPutFilter", function(){
    it("should not apply the put until it has gone through the filter", function(){
    
      var filterCalled=false;
      var putCalled = false;
      Server.registerPutFilter({foo:"bar"}, function(server,data,success){
        success(data);
        filterCalled=true;
      });

      var data = {foo: "bar"};
      ClientA.put(data, function(data){ 
        putCalled=true;
      });
      waitsFor(function() {
        return putCalled;
      }, "the put callback must be invoked", 5000);

      runs(function(){ 
        expect(filterCalled).toBe(true);
        expect(putCalled).toBe(true);
      });
    });
    it("should work with empty match object", function(){
      
      var filterCalled=false;
      var putCalled = false;
      Server.registerPutFilter({}, function(server,data,success){
        success(data);
        filterCalled=true;
      });

      var data = {foo: "bar"};
      ClientA.put(data, function(data){ 
        putCalled=true;
      });

      waitsFor(function() {
        return putCalled;
      }, "the put callback must be invoked", 5000);
      runs(function(){
        expect(filterCalled).toBe(true);
        expect(putCalled).toBe(true);
      });
    });

    it("should not run filter on non-matching data", function(){  
      var filterCalled=false;
      var putCalled = false;
      Server.registerPutFilter({bar: "mars"}, function(server,data,success){
        success(data);
        filterCalled=true;
      });

      var data = {foo: "bar"};

      ClientA.put(data, function(data){ 
        putCalled=true;
      });

      waitsFor(function() {
        return putCalled;
      }, "the put callback must be invoked", 5000);

      expect(filterCalled).toBe(false);
//      expect(putCalled).toBe(true);
    });
  });

  xdescribe("._getMatchingFilters", function(){
    it("should return functions for matching data", function(){
      var myPutFilter = function (server,socket, params, success){
        success([{foo:"bar",age:3}]);
        filterCalled=true;
      }
      Server.registerPutFilter({foo:"bar"}, myPutFilter);

      var putFilters = Server._getMatchingFilters({foo:'bar'}, Server.put_filters);

      expect(putFilters).toContain(myPutFilter);
    });
    it("should return an empty array for non matching data", function(){
      
      Server.registerPutFilter({foo:"bar"}, function (server,socket, params, success){
        success([{foo:"bar",age:3}]);
        filterCalled=true;
      });

      var putFilters = Server._getMatchingFilters({ex:'wool'}, Server.put_filters);

      expect(putFilters).toEqual([]);
    });
  });

  xdescribe(".registerListFilter", function(){
    it("should call the filter function before returning the list", function(){
    
      var filterCalled=false;
      var listCalled = false;
      Server.registerListFilter({foo:"bar"}, function(server,socket, params, success){
        success([{foo:"bar",age:3}]);
        filterCalled=true;
      });

      var data = {foo: "bar"};
      ClientA.list(data, function(data){ 
        listCalled=true;
      });

      runs(function(){
        expect(filterCalled).toBe(true);
        expect(listCalled).toBe(true);
      });
    });
  });

});

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

  describe(".registerPutFilter", function(){
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

  describe("._getMatchingFilters", function(){
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

  describe(".registerListFilter", function(){
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

  describe(".put a new object", function(){
    it("should share between the clients", function(){
      var blob = {id: 'Sherlock', name: 'Sherlock'};
      blob[ID_FIELD] = blob.id;
      var isPut = false;
      ClientA.put(blob, function(){
        isPut=true;
      });
      
      waitsFor(function(){
        return isPut;
      },"put timed out", 5000);

      runs(function(){
        expect(ClientB.Store.index).toEqual(ClientA.Store.index);
//      expect(Server.Store.index).toEqual(ClientA.Store.index);
      });
    });
    it("should unflatten objects", function(){ 
      var blob = {id: 'Sherlock', name: 'Sherlock', friend: { name: 'Watson'}};
      blob[ID_FIELD] = blob.id;
      var isPut = false;
      var sherlock = ClientA.put(blob, function(){
        isPut=true;
      });
      waitsFor(function(){ return isPut }, "put timed out", 500);
      runs(function(){
        expect(sherlock.friend.name).toBe('Watson');
        expect(ClientB.Store).toEqual(ClientA.Store);
        //expect(Server.Store).toEqual(ClientA.Store);
      });
    });
    describe("replacing literal values with objects", function(){
      it("should replace the value", function(){
        var flossy = {type: 'Sheep', name: 'flossy', farm: 'Green Acres'};
        ClientA.put(flossy);
        flossy.farm = {name: 'Waltons Farm', type: 'Farm'};
        ClientA.put(flossy);
        var sheep = ClientB.list({type:'Sheep'});
        expect(sheep[0].farm.name).toEqual( 'Waltons Farm');
        expect(flossy.farm.name).toEqual( 'Waltons Farm');
      });
    });
  });
});

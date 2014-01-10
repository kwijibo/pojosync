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
    ClientA = new live.Client(clientIO);
    ClientB = new live.Client(clientIO);
  });

  describe(".put a new object", function(){
    it("should share between the clients", function(){
      ClientA.put({id: 'Sherlock', name: 'Sherlock'});
      expect(ClientB.Store.index).toEqual(ClientA.Store.index);
//      expect(Server.Store.index).toEqual(ClientA.Store.index);
    });
    it("should unflatten objects", function(){ 
      var sherlock = ClientA.put({id: 'Sherlock', name: 'Sherlock', friend: { name: 'Watson'}});
      console.log(sherlock);
      expect(sherlock.friend.name).toBe('Watson');
      expect(ClientB.Store).toEqual(ClientA.Store);
//      expect(Server.Store).toEqual(ClientA.Store);
    });
  });
});

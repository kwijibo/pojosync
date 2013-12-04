var Client = require('../lib/client.js');

describe("Client", function(){
  
  beforeEach(function(){
    var fun = function(){ return { on: fun, emit: fun } };
    this.Client = new Client({connect:fun });
  });

  describe("removeSocketCallback", function(){
    it("should remove the function from the socket callback array", function(){
      var fun = function(a){ return a;  };
      this.Client.addSocketCallback(fun);
      expect(this.Client.socketCallbacks.length).toBe(1);
      expect(this.Client.socketCallbacks.length).toBe(0);
    });
  });

  describe("addSocketCallback", function(){
    it("should not add the same function twice", function(){
      var fun = function(a){ return a;  }
      this.Client.addSocketCallback(fun);
      this.Client.addSocketCallback(fun);
      this.Client.addSocketCallback(fun);
      expect(this.Client.socketCallbacks.length).toBe(1);
    });
  });

});

var Client = require('../lib/client.js');

describe("Client", function(){
  
  beforeEach(function(){
    var jsonify = function(ev, a){ return JSON.stringify(a)};
    var fun = function(){ return { on: fun, emit: jsonify } };
    this.Client = new Client({connect:fun });
  });
  describe(".put", function(){
    it("should cope with circular structures", function(){
      var a = {};
      var b = {};
      var c = {};
      a.next = b;
      b.next = c;
      c.next = a;
      this.Client.put(a);
    });
    it("should add new related objects to the appropriate lists", function(){
      var farms = this.Client.list({type:'Farm'});
      var flossy = {name: 'flossy', farm: { name: 'Green Acres', type: 'Farm' }};
      this.Client.put(flossy);
      expect(farms.length).toBe(1);
    });
  });

  describe("removeSocketCallback", function(){
    it("should remove the function from the socket callback array", function(){
      var fun = function(a){ return a;  };
      this.Client.addSocketCallback(fun);
      expect(this.Client.socketCallbacks.length).toBe(1);
      this.Client.removeSocketCallback(fun);
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

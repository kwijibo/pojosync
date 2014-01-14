var Client = require('../lib/client.js');

describe("Client", function(){
  
  beforeEach(function(){
    var jsonify = function(ev, a){ return JSON.stringify(a)};
    var fun = function(){ return { on: fun, emit: jsonify } };
    this.Client = new Client({connect:fun });
    this.Client.Store.index = {};
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
      var flossylist = this.Client.list({name: 'flossy'});
      var flossy = {name: 'flossy', farm: { name: 'Green Acres', type: 'Farm' }};
      var indexedFlossy = this.Client.put(flossy);
      expect(farms.length).toBe(1);
      expect(flossylist[0].farm.name).toEqual('Green Acres');
      expect(indexedFlossy.farm.name).toEqual('Green Acres');
    });

    it("should not delete subsidiary objects of the old version", function(){
      var flossy = {name: 'flossy', farm: { name: 'Green Acres', type: 'Farm' }};
      this.Client.put(flossy);
      flossy.farm = {name: 'Waltons Farm', type: 'Farm'};
      this.Client.put(flossy);
      var farms = this.Client.list({type:'Farm'});
      expect(farms.length).toBe(2);
    });

    describe(".receivePut replacing literal values with objects", function(){
      it("should replace the value with an object reference", function(){
        var flossy = {id: 'flossy', type: 'Sheep', name: 'flossy', farm: 'Green Acres'};
        this.Client.put(flossy);
        var putdata = { 
          flossy: { type: 'Sheep',
           name: 'flossy',
           farm: '@ktjy3416619593',
           id: 'flossy' 
          },
          ktjy3416619593: { 
            name: 'Waltons Farm', 
            type: 'Farm', 
            id: 'ktjy3416619593' } 
        }
        this.Client.receivePut(putdata)
        var sheep = this.Client.list({type:'Sheep'});
        expect(sheep[0].farm.name).toEqual( 'Waltons Farm');
        expect(flossy.farm.name).toEqual( 'Waltons Farm');
      });
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

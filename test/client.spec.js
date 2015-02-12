var Client = require('../lib/client.js');
var ID_FIELD = require('../lib/utils.js').ID_FIELD;

describe("Client", function(){
  
  beforeEach(function(){
    var jsonify = function(ev, a){ return JSON.stringify(a)};
    var fun = function(){ return { on: fun, emit: jsonify } };
    this.Client = new Client(fun());
    this.Client.BeforeStore.index = {};
    this.Client.AfterStore.index = {};
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
    it("should add new objects to the appropriate lists", function(){
      var farms = this.Client.list({type:'Farm'});
      var farm = { name: 'Green Acres', type: 'Farm' };
      this.Client.put(farm);
      expect(farms.length).toBe(1);
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

    it("should add new related objects to the appropriate lists with multiple lists", function(){
      var farms = this.Client.list({type:'Farm'});
      var flossylist = this.Client.list({name: 'flossy'});
      var flossylistB = this.Client.list({name: 'flossy'});
      var flossy = {name: 'flossy', farm: { name: 'Green Acres', type: 'Farm' }};
      var indexedFlossy = this.Client.put(flossy);
      expect(farms.length).toBe(1);
      expect(flossylist[0].farm.name).toEqual('Green Acres');
      expect(flossylistB[0].farm.name).toEqual('Green Acres');
      expect(indexedFlossy.farm.name).toEqual('Green Acres');
    });

    it("should cope with objects with null values", function(){
      var job = {"uri": "ff80808148c18b480148c1c037cd0021","creator":null,"creation_time":1411999872000,"name":"Copy Move Delete Upload Test","full_name":"Copy Move Delete Upload Test - 5909","started_on":1412002840514,"completed_on":null,"progress":0,"status":"RUNNING","instance_id":null};
      var job2 = {"uri": "ff80808148c18b480148c1c037cd0021","creator":null,"creation_time":1411999872000,"name":"Copy Move Delete Upload Test","full_name":"Copy Move Delete Upload Test - 5909","started_on":1412002840514,"completed_on":null,"progress":0,"status":"RUNNING","instance_id":null};
      var result = this.Client.put(job);
      var result2 = this.Client.put(job2);
      expect(result.name).toBe(job.name);
    })




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

  describe("._getMatchingList", function(){
    it("should return false when there are no matching lists", function(){
      expect(this.Client._getMatchingList({type:'Baboon'})).toBeFalsy();
    });
    it("should return a list when there is a matching list", function(){
      var book = {type:'Book',title:'Hard Times', date: '1888'};
      this.Client.put(book);
      this.Client.list({type: 'Book'});
      expect(this.Client._getMatchingList({type:'Book'})).toEqual([book]);
    });
  });
  describe(".list", function(){
  
    it("should return the same array for the same query", function(){ 
      this.Client.put({name:'Greenacres',type:'Farm'});
      var farms1 = this.Client.list({type:'Farm'});
      var farms2 = this.Client.list({type:'Farm'});
      expect(this.Client.lists.length).toBe(1);
      expect(farms1).toBe(farms2);
    });

    it("should return data in the callback", function(){
      var farms = this.Client.list({type:'Farm'});
      var flossy = {name: 'flossy', farm: { name: 'Green Acres', type: 'Farm' }};
      var indexedFlossy = this.Client.put(flossy);
      var flossylist = this.Client.list({name: 'flossy'}, function(l){
        expect(flossylist[0].farm.name).toEqual('Green Acres');
      });
      expect(farms.length).toBe(1);
      expect(indexedFlossy.farm.name).toEqual('Green Acres');
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

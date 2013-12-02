var Store = require('../lib/store.js');
var TestStore = new Store();

describe("Store", function(){
  beforeEach(function(){
    TestStore = new Store();
  });  
  describe("assignID, not passed a type", function(){
    it("should assign an id based on 'resource' ", function(){
      var res = TestStore.assignID({nottype:'Rabbit'});
      expect(res.id).toBe('resource:1');
      var res2 = TestStore.assignID({nottype:'Rabbit'});
      expect(res2.id).toBe('resource:2');
    });
  });
  describe("assignID, passed a type", function(){
    it("should assign an id based on the type ", function(){
      var res = TestStore.assignID({type:'Rabbit'});
      expect(res.id).toBe('Rabbit:1');
      var res2 = TestStore.assignID({type:'Rabbit'});
      expect(res2.id).toBe('Rabbit:2');
    });
  });
  describe(".put with a new object", function(){
    it("should add an id to the object and insert it into the index", function(){
      var foo = {a: 'hello',b:'world'};
      var resource = TestStore.put(foo);
      expect(resource.id).toEqual('resource:1');
      expect(resource.a).toEqual(foo.a);
      expect(resource.b).toEqual(foo.b);
    });
  });
  describe(".put replacing an object", function(){
    it("should replace the original object", function(){
      var foo = {a: 'hello',b:'world'};
      var resource = TestStore.put(foo);
      resource.a = 'Goodbye';
      console.log(resource, foo, next);
      var next = TestStore.put(resource);
      expect(TestStore.get(resource.id)).toEqual(resource);
    });
  });

  describe(".delete", function(){
    it("should delete the object from the store", function(){
      var res = TestStore.put({type:'Dog',name:'Pluto', 'id': 'Dog:1'});
      TestStore.delete(res);
      expect(TestStore.get('Dog:1')).toBeFalsy();
    });
  });

  describe(".list", function(){
    it("should return a filtered list of the index contents", function(){
      TestStore.put({type:'Mouse',name:'Mickey'});
      TestStore.put({type:'Mouse',name:'Mini'});
      TestStore.put({type:'Mouse',name:'Danger Mouse'});
      TestStore.put({type:'Dog',name:'Pluto'});
      expect(TestStore.listAll().length).toBe(4);
      expect(TestStore.list({type:'Dog'}).length).toBe(1);
      expect(TestStore.list({type:'Mouse'}).length).toBe(3);
      expect(TestStore.list({type:'Mouse',name:'Mini'}).length).toBe(1);
    });
  });

});

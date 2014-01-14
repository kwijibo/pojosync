var Store = require('../lib/store.js');
var TestStore = new Store();
var Utils = require('../lib/utils.js');
describe("Store", function(){
  beforeEach(function(){
    TestStore = new Store();
  });  
  describe("assignID", function(){
    it("should assign an id based on 'resource' ", function(){
      var res = TestStore.assignID({nottype:'Rabbit'});
      expect(res.id).toBeTruthy();
      var res2 = TestStore.assignID({nottype:'Rabbit'});
      expect(res2.id).not.toEqual(res.id);
    });
  });
  describe(".put with a new object", function(){
    it("should add an id to the object and insert it into the index", function(){
      var foo = {a: 'hello',b:'world'};
      var resource = TestStore.put(foo);
      expect(resource.id).toBeTruthy();
      expect(resource.a).toEqual(foo.a);
      expect(resource.b).toEqual(foo.b);
    });
  });
  describe(".put replacing an object", function(){
    it("should replace the original object", function(){
      var foo = {a: 'hello',b:'world'};
      var resource = TestStore.put(foo);
      resource.a = 'Goodbye';
      var next = TestStore.put(resource);
      expect(TestStore.get(resource.id)).toEqual(resource);
    });
  });

  describe(".put replacing a literal with an object", function(){
    it("should replace the original object", function(){
      spyOn(Utils, 'replaceResourceContents').andCallThrough();
      var flossy = {id: 'flossy', type: 'Sheep', name: 'flossy', farm: 'Green Acres'};
      TestStore.put(flossy);
      var flossy2 = {id: 'flossy', type: 'Sheep', name: 'flossy', farm: { name: 'Waltons Farm'} };
      TestStore.put(flossy2);
      var sheep = TestStore.list({type:'Sheep'});
      expect(sheep[0].farm.name).toEqual( 'Waltons Farm');
      expect(flossy.farm.name).toEqual( 'Waltons Farm');
      expect(Utils.replaceResourceContents).toHaveBeenCalledWith(flossy,flossy2);
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

  describe('.indexResource', function(){
    beforeEach(function(){
       this.resource = { 
        name: 'Sherlock Holmes', 
        friends: [ { id: 'mrsH', name: 'Mrs Hudson' }, {name: 'Dr. Watson'}], 
        mortalEnemy: {
          name: 'Prof. Moriarty'
        } 
      };
      TestStore.indexResource(this.resource);
    });
    it("should copy object property values to top level in the index", function(){
      expect(TestStore.get('mrsH')).toBe(this.resource.friends[0]);
    });
    it("should assign ids to object property values that don't have them", function(){
      expect(this.resource.friends[1].id).toBeTruthy();
    });
    it("should cope with circular references", function(){
      this.resource.friends[0].friend = this.resource;
      this.resource.friends[1].friend = this.resource.friends[0];
      TestStore.indexResource(this.resource);
    });
    it("should cope with circular references", function(){
      var a = {}, b = {}, c = {};
      a.next = b; b.next = c;  c.next = a;
      TestStore.indexResource(a);
      expect(a.id).toBeTruthy();
      expect(b.id).toBeTruthy();
      expect(c.id).toBeTruthy();
    });
  });


  describe("flatten and unflatten", function(){
    it("should keep arrays as arrays", function(){
      var a = {id: 'a', list: [ 2,4,7,8 ]};
      var index = TestStore.flatten(a);
      expect(Array.isArray(index['a'].list)).toBeTruthy();
    });
    it("should cope with circular references", function(){
      var a = {id:'a'}, b = {id:'b'}, c = {id:'c'};
      a.next = b; b.next = c;  c.next = a;
      var data = TestStore.flatten(a);
      expect(Object.keys(data).length).toBe(3);
    });

    it("should unflatten several levels deep", function(){
      var sheet = { rows: [ { cols: [ {value: "a"}, {value: "b"} ] }] };
      TestStore.put(sheet);
      var data = TestStore.flatten(sheet);
      expect(Object.keys(data).length).toBe(4);
      TestStore.unflattenAndPut(data);
      JSON.stringify(TestStore.index);
      expect(sheet.rows[0].cols[0].value).toEqual("a");
    });

  });

  describe("put", function(){
    it("should not swap subsidiary objects within other objects", function(){
      var admin = {type: 'Role', name: 'Admin', id: 'admin'};
      var user = {type: 'Role', name: 'User', id: 'user'};
      var user_a = {type: 'User', id: 'a', role: admin };
      var user_b = {type: 'User', id: 'b', role: admin };
      TestStore.put(user_a);
      TestStore.put(user_b);
      user_a.role = user;
      var flat = TestStore.flatten(user_a);
      TestStore.unflattenAndPut(flat);
      expect(user_b.role).toBe(admin);
      expect(user_b.role.name).toBe('Admin');
      expect(TestStore.get('b').role.name).toBe('Admin');
    })
  });
  
});

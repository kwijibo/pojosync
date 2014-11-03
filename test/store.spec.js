var Store = require('../lib/store.js');
var TestStore = new Store();
var Utils = require('../lib/utils.js');
var ID_FIELD = Utils.ID_FIELD;

describe("Store", function(){
  beforeEach(function(){
    TestStore = new Store();
  });  

  describe("matchesFilter", function(){
    it("should return false if the filter doesn't match",function(){
      expect(TestStore.matchesFilter({type:"Bar"}, {type:"Foo"})).toBe(false);
    });

    it("should return true if the filter does match",function(){
      expect(TestStore.matchesFilter({id: "bc52", type:"Bar"}, {type:"Bar"})).toBe(true);
    })
  });

  describe("assignID", function(){
    it("should assign an id based on 'resource' ", function(){
      var res = TestStore.assignID({nottype:'Rabbit'});
      expect(res[ID_FIELD]).toBeTruthy();
      var res2 = TestStore.assignID({nottype:'Rabbit'});
      expect(res2[ID_FIELD]).not.toEqual(res[ID_FIELD]);
    });
  });
  describe(".put with a new object", function(){
    it("should add an id to the object and insert it into the index", function(){
      var foo = {a: 'hello',b:'world'};
      var resource = TestStore.put(foo);
      expect(resource[ID_FIELD]).toBeTruthy();
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
      expect(TestStore.get(resource[ID_FIELD])).toEqual(resource);
    });
  });

  describe(".put replacing a literal with an object", function(){
    it("should replace the original object", function(){
      spyOn(Utils, 'replaceResourceContents').andCallThrough();
      var flossy = {id: 'flossy', type: 'Sheep', name: 'flossy', farm: 'Green Acres'};
      flossy[ID_FIELD] = flossy.id;
      TestStore.put(flossy);
      var flossy2 = {id: 'flossy', type: 'Sheep', name: 'flossy', farm: { name: 'Waltons Farm'} };
      flossy2[ID_FIELD] = flossy2.id;
      TestStore.put(flossy2);
      var sheep = TestStore.list({type:'Sheep'});
      expect(sheep[0].farm.name).toEqual( 'Waltons Farm');
      expect(flossy.farm.name).toEqual( 'Waltons Farm');
      expect(Utils.replaceResourceContents).toHaveBeenCalledWith(flossy,flossy2);
    });
  });
  describe(".delete", function(){
    it("should delete the object from the store", function(){
      var dog = {type:'Dog',name:'Pluto', 'id': 'Dog:1'};
      dog[ID_FIELD] = dog.id;
      var res = TestStore.put(dog);
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
      this.resource.friends[0][ID_FIELD] = this.resource.friends[0].id;
      TestStore.indexResource(this.resource);
    });
    it("should copy object property values to top level in the index", function(){
      expect(TestStore.get('mrsH')).toBe(this.resource.friends[0]);
    });
    it("should assign ids to object property values that don't have them", function(){
      expect(this.resource.friends[1][ID_FIELD]).toBeTruthy();
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
      expect(a[ID_FIELD]).toBeTruthy();
      expect(b[ID_FIELD]).toBeTruthy();
      expect(c[ID_FIELD]).toBeTruthy();
    });
  });


  describe("flatten and unflatten", function(){
    it("should keep arrays as arrays", function(){
      var a = {id: 'a', list: [ 2,4,7,8 ]};
      a[ID_FIELD] = a.id;
      var index = TestStore.flatten(a);
      expect(Array.isArray(index['a'].list)).toBeTruthy();
    });
    it("should cope with circular references", function(){
      var a = {id:'a'}, b = {id:'b'}, c = {id:'c'};
      a[ID_FIELD] = a.id;
      b[ID_FIELD] = b.id;
      c[ID_FIELD] = c.id;
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
      admin[ID_FIELD] = admin.id;
      user[ID_FIELD] = user.id;
      user_a[ID_FIELD] = user_a.id;
      user_b[ID_FIELD] = user_b.id;
      
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

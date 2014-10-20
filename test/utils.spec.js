var Utils = require('../lib/utils.js');
var ID_FIELD = Utils.ID_FIELD;

describe("Utils.resourceIsEmpty", function(){
  it("should return true when the only key is 'id'", function(){
    var res = {};
    res[ID_FIELD]='foo';
    expect(Utils.resourceIsEmpty(res)).toBe(true);
  });
  it("should return true when there are no keys", function(){
    expect(Utils.resourceIsEmpty({})).toBe(true);
    expect(Utils.resourceIsEmpty([])).toBe(true);
  });
  it("should return false when the resource contains other keys", function(){
    expect(Utils.resourceIsEmpty({id:'foo', bar:'green'})).toBe(false);
  });
});

describe("Utils.replaceResourceContents", function(){
  it("should only change the contents, not wipe out the original object", function(){
    var before = { type: 'Penguin', name: 'Pingu' };
    var after = {type: 'Pig', name:  'Percy'};
    var copy = before;
    Utils.replaceResourceContents(before,after);
    expect(copy).toBe(before);
    expect(before).toEqual(after);
    expect(before.type).toEqual('Pig');
  });

  it("should the contents recursively, not wipe out the original object", function(){
    var before = { character: {  friends: ['Tommy','Dick', 'Albright'] }};
    var after = { character: { friends: ['Tommy','Dick', 'Albright', 'Nina'] } };
    var copy = before;
    Utils.replaceResourceContents(before,after);
    expect(copy.character.friends).toBe(before.character.friends);
    expect(before.character.friends).toEqual(after.character.friends);
  });

  it("should not replace contents of a.p with b.p if they have different ids, but replace the whole object", function(){
    var a = {'@id': 'a' };
    var b = {'@id': 'b'};
    a.likes = {'@id':'c'};
    b.likes = a.likes;
    var new_a = { '@id': 'a', likes: {'@id': 'd'} };
    a[ID_FIELD] = 'a';
    b[ID_FIELD] = 'b';
    a.likes[ID_FIELD] = 'c';
    new_a.likes[ID_FIELD] = 'd';
    Utils.replaceResourceContents(a, new_a);
    expect(a.likes[ID_FIELD]).toBe('d');
    expect(b.likes[ID_FIELD]).toBe('c');
  });

  it("should change number values", function(){
    var b = {a:1};
    var a = {a:4};
    Utils.replaceResourceContents(b,a);
    expect(b.a).toBe(4);
  });

  it("should cope with replacing objects containing null values", function(){
    var A = {foo: null};
    var B = {foo: null, bar:45};
    Utils.replaceResourceContents(A,B);
    expect(A.bar).toBe(45);
  });

});


describe(".mergeResourceContents", function(){
  beforeEach(function(){
    this.oldr = { name: 'Top Cat', friends: ['Benny','Choo-Choo'], likes: { id: 'Trixie', name: 'Trixie' }  };
    var newr = { name: 'Top Cat', colour: 'Yellow', friends: ['Brain','Fancy-Fancy'], likes: { id: 'Trixie', worksFor:'Strickland'}  };
    var merge = Utils.mergeResourceContents(this.oldr,newr);
  });
  it("should overwrite single value string/number/boolean properties", function(){
   expect(this.oldr.name).toBe('Top Cat');
   expect(this.oldr.colour).toBe('Yellow');
  });
  it("should overwrite array values", function(){
    var oldr=this.oldr;
    expect(oldr.friends).toEqual(['Brain','Fancy-Fancy']);
  });
  it("should merge object values", function(){
    var oldr=this.oldr;
    expect(oldr.likes.name).toBe('Trixie');
    expect(oldr.likes.worksFor).toBe('Strickland');
  });
  it("should cope with null values in before", function(){
    var before = { foo: null };
    var after = { foo: 'bar' };
    var result = Utils.mergeResourceContents(before,after);
    expect(before.foo).toBe('bar');
  });

  it("should cope with null values in after", function(){
    var before = { foo: 'bar' };
    var after = { foo: null };
    var result = Utils.mergeResourceContents(before,after);
    expect(before.foo).toBe(null);
  });

  it("it should cope with a null value as before", function(){
    var before = {}, after = {foo:'bar', bar: null};
    var result = Utils.mergeResourceContents(before,after, true);
    expect(before.foo).toBe('bar');
    expect(before.bar).toBe(null);
  });
});

describe(".objectsEquivalent", function(){
  it("should return true when arguments have all the same properties and values", function(){
    var a = {foo:34, bar: "$$"},
        b = {foo:34, bar:"$$"};
    expect(Utils.objectsEquivalent(a,b)).toBeTruthy();
  });
  it("should return false when arguments have differing properties and values", function(){
    var a = {foo:36, bar: "$$"},
        b = {foo:34, bar:"$$"};
    expect(Utils.objectsEquivalent(a,b)).toBeFalsy();
  });
});

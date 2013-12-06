var Utils = require('../lib/utils.js');

describe("Utils.resourceIsEmpty", function(){
  it("should return true when the only key is 'id'", function(){
    expect(Utils.resourceIsEmpty({id:'foo'})).toBe(true);
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

  it("should change number values", function(){
    var b = {a:1};
    var a = {a:4};
    Utils.replaceResourceContents(b,a);
    expect(b.a).toBe(4);
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
});

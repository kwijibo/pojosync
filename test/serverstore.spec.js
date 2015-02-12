var ServerStore = require('../lib/serverstore.js');
describe("ServerStore", function(){
  describe("_listParamsToPatterns", function(){
    it("should turn an object into a triple pattern", function(){
      var store = new ServerStore('testpojosync');
      var params = {type: 'Person', friend: { age: 70 } };
      var result = store._listParamsToPatterns(params);
      expect(result).toEqual(
        [
          {subject: store.db.v('s'), predicate: 'type', object: 'Person'},
          {subject: store.db.v('s'), predicate: 'friend', object: store.db.v('sn')},
          {subject: store.db.v('sn'), predicate: 'age', object: 70}
        ]
      );
    });
  });
  describe("get", function(){
    it("should test async", function(done){
      done();
      expect(true).toBe(true);
    });
    it("should retrieve an object by id", function(done){
      var store = new ServerStore('testpojosync');
      var p = store.applyChangeset([
        {s:'floyd',p:'type', o: 'Tortoise', action: 'addition'},
        {s:'floyd',p:'name', o: 'Floyd', action: 'addition'}
      ]);
      done();
      p.then(function(err){
        store.get('floyd').then(function(res){
          expect(res).toEqual({uri: 'floyd', type: 'Tortoise', name: 'Floyd'});
        });
      });
    });
  });
});

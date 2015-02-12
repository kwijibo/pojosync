var Store = require('../lib/store.js');
var TestStore = new Store({id_field: 'uri'});
var Utils = require('../lib/utils.js');
var ID_FIELD = Utils.ID_FIELD;

describe("Store", function(){
  beforeEach(function(){
    TestStore = new Store();
  });  

  describe("applyChangeset", function(){
    
    describe("additions", function(){
    
      it("should create a new object in the index - object literal", function(){
        var cs = [{action: 'addition', s: 'frank', p: 'loves', o:'Music', o_type: 'literal', p_type: 'single'}];
        TestStore.applyChangeset(cs);
        var res = TestStore.get('frank');
        expect(res).toEqual({uri: 'frank', loves: 'Music'});
      });
      it("should create a new object in the index - object resource", function(){
        var cs = [{action: 'addition', s: 'frank', p: 'loves', o:'Music', o_type: 'resource', p_type: 'single'}];
        TestStore.applyChangeset(cs);
        var res = TestStore.get('frank');
        expect(TestStore.get('Music')).toEqual({uri: 'Music'});
        expect(res).toEqual({uri: 'frank', loves: { uri: 'Music'} });
      });
      it("should create the value within an array - p_type array", function(){
        var cs = [{action: 'addition', s: 'frank', p: 'loves', o:'Music', o_type: 'literal', p_type: 'array'}];
        TestStore.applyChangeset(cs);
        var res = TestStore.get('frank');
        expect(res).toEqual({uri: 'frank', loves: ['Music'] });
      });
      it("should create the value within an array - p_type array, o_type: resource", function(){
        
        var cs = [{action: 'addition', s: 'frank', p: 'loves', o:'Music', o_type: 'resource', p_type: 'array'}];
        TestStore.applyChangeset(cs);
        var res = TestStore.get('frank');
        expect(res).toEqual({uri: 'frank', loves: [{uri: 'Music'} ] });
      });
        
      describe("with existing data", function(){
        beforeEach(function(){
          TestStore.index = {
            'frank': { uri: 'frank', name: "Frank" }
          }
        });

        it("should not replace the existing data", function(){
            
          var cs = [{action: 'addition', s: 'frank', p: 'loves', o:'Music', o_type: 'resource', p_type: 'array'}];
          TestStore.applyChangeset(cs);
          var res = TestStore.get('frank');
          expect(res).toEqual({uri: 'frank', name: 'Frank', loves: [{uri: 'Music'} ] });
        });
      
      });

    });
  
  });


  describe(".list", function(){
    it("should return a filtered list of the index contents", function(){
      TestStore.index = {
        mickey: {type:'Mouse',name:'Mickey'},
        mini: {type:'Mouse',name:'Mini'},
        dm: {type:'Mouse',name:'Danger Mouse'},
        pluto: {type:'Dog',name:'Pluto'}
      };
      expect(TestStore.listAll().length).toBe(4);
      expect(TestStore.list({type:'Dog'}).length).toBe(1);
      expect(TestStore.list({type:'Mouse'}).length).toBe(3);
      expect(TestStore.list({type:'Mouse',name:'Mini'}).length).toBe(1);
    });
  });




  
});

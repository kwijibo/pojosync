var Changeset = require('../lib/changeset.js');

describe("Changeset", function(){
  
  it("should create additions when the before is empty", function(){
    
    var before = {};
    var after = {uri: "frank", loves: "music" };
    var expected_cs = [{action: 'addition', s:'frank',p:'loves',o:'music',o_type: 'literal', p_type: 'single'}];
    var actual = Changeset(before, after);
    expect(actual).toEqual(expected_cs);

  });
  it("should create removals when the after is empty", function(){
    
    var after = {};
    var before = {uri: "frank", loves: "music" };
    var expected_cs = [{action: 'removal', s:'frank',p:'loves',o:'music',o_type: 'literal', p_type: 'single'}];
    var actual = Changeset(before, after);
    expect(actual).toEqual(expected_cs);

  });

  it("should generate addition triples for deep in the object", function(){
    var before = {},
    after = {uri: 'frank', knows: { uri: 'clara', name: 'Clara' } };
    var expected = [{action: 'addition', s:'frank', p: 'knows', o:'clara', 'o_type': 'resource', p_type: 'single'}, 
    {action: 'addition', s:'clara', p: 'name', o:'Clara', 'o_type': 'literal', p_type: 'single'}
    ];
    var cs = Changeset(before,after);
    expect(cs).toEqual(expected);
  });

  it("shouldn't delete something that was merely unlinked", function(){
    var before = {uri: 'frank', knows: { uri: 'clara', name: 'Clara' } };
    var after = {uri: 'frank'};
    var expected = [{action: 'removal', s:'frank', p: 'knows', o:'clara', 'o_type': 'resource', p_type: 'single'}];
    var cs = Changeset(before,after);
    expect(cs).toEqual(expected);
  });


  describe("replacing nested objects", function(){
    it("shouldn't lose triples", function(){
      
      var before = {uri: 'frank', knows: { uri: 'clara', name: 'Clara', type: 'Person' , age: 25} };
      var after = {uri: 'frank', knows: { uri: 'jon', name: 'Jon', type: 'Person', age: 25 } };
      var expected = [
        {action: 'removal', s:'frank', p: 'knows', o:'clara', 'o_type': 'resource', p_type: 'single'},
        {action: 'addition', s:'frank', p: 'knows', o:'jon', 'o_type': 'resource', p_type: 'single'},
        {action: 'addition', s:'jon', p: 'name', o:'Jon', 'o_type': 'literal', p_type: 'single'},
        {action: 'addition', s:'jon', p: 'type', o:'Person', 'o_type': 'literal', p_type: 'single'},
        {action: 'addition', s:'jon', p: 'age', o: 25, 'o_type': 'literal', p_type: 'single'}
      ];
      var actual = Changeset(before,after);
      expect(Changeset(before,after)).toEqual(expected);
    });
  });

});

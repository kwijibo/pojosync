
var ID_FIELD = 'uri';

var Utils = {
  ID_FIELD: ID_FIELD,
  objectsEquivalent: function(a,b){
   // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    // If we made it this far, objects
    // are considered equivalent
    return true;    
  },
  copyResource: function(resource){
    var clone = {};
    for(var p in resource){
      if(typeof(resource[p]=='object')){
        clone[p]=Utils.copyResource(resource[p]);
      } else {
        clone[p]=resource[p];
      }
    }
    return clone;
  },
  resourceIsEmpty: function(resource){
    var keys = Object.keys(resource);
    return !keys.length || (keys.length==1 && keys[0]==ID_FIELD);
  },
  replaceResourceContents: function(before,after){ 
    Utils.mergeResourceContents(before,after,true);
    for(var p in before){
      if(!after.hasOwnProperty(p)){
        delete before[p];
      }
    }
  },
  mergeResourceContents: function(before,after,replace){
    if(before==after){ 
      return before; 
    }
    if(!before){ 
      before = after;
      return before;
    }
    for(var p in after){
      if(after.hasOwnProperty(p)){
        switch(typeof after[p]){
          case 'object':
            if(before.hasOwnProperty(p) && typeof before[p]=='object'){
              if(before[p]!==null && before[p].hasOwnProperty(ID_FIELD) && before[p][ID_FIELD] && after[p][ID_FIELD] && before[p][ID_FIELD] != after[p][ID_FIELD]){
               before[p] = after[p];
              } else if(replace){
                Utils.replaceResourceContents(before[p],after[p]);
              } else{
                Utils.mergeResourceContents(before[p],after[p]);
              }
            } else {
             before[p] = after[p];
            }
            break;
          case 'number':
          case 'string':
          case 'boolean':
          default:
            before[p]=after[p];
            break;
        }
      }
    }
    return before;
  }
};
module.exports = Utils;

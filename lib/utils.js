
var Utils = {

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
    return !keys.length || (keys.length==1 && keys[0]=='id');
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
            if(before.hasOwnProperty(p)){
              if(replace){
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
  }
};
module.exports = Utils;

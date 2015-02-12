var Utils = require('./utils.js');
var ID_FIELD = Utils.ID_FIELD;

function Changeset(before,after){
  //expose for testing
  this.equiv = equiv;
  this.notIn = notIn;

  before = before || {};
  after = after || {};

  var removals = notIn(before, after, 'removal');
  var additions = notIn(after, before, 'addition');
  return removals.concat(additions);
}


function equiv(x,y){
  if( (x && y) && 
      (x==y || (x[ID_FIELD] && y[ID_FIELD] && x[ID_FIELD] == y[ID_FIELD] ))
    ) {
      return true;
    }
    return false;
}

function packChange(s,p, p_type, o,action){
  var ob, ob_type;
  if(o===Object(o) && !o[ID_FIELD]){  
    o[ID_FIELD]=Utils.generateID(); 
  }
  if(!o){
    ob = '';
    ob_type = 'literal';
  } else {
    ob = o[ID_FIELD] || o;
    ob_type = (o[ID_FIELD])? 'resource' : 'literal';
  }
  if(ob[0]=='@'){
    ob_type='resource';
    ob = ob.substring(1);
  }
  return { action: action, s: s[ID_FIELD], p: p, p_type: p_type, o: ob, o_type: ob_type };
}

function isObject(o){
  return o===Object(o);
}

function notIn(x,y, action, traversedStack){
    x = x || {};
    y = y || {};
    x[ID_FIELD] = x[ID_FIELD] || Utils.generateID();
    traversedStack = traversedStack || {'addition':{}, 'removal': {}};
    if(traversedStack[action][x[ID_FIELD]]){ 
      return []; 
    }
    traversedStack[action][x[ID_FIELD]]=true;

    var changes = [];
    for(var p in x){
      if(x.hasOwnProperty(p) && p!=ID_FIELD){
        if(Array.isArray(x[p])){
          for(var i=0;i<x[p].length;i++){
            changes.push(packChange(x, p, 'array', x[p][i], action))
            if(isObject(x[p][i]) && action==='addition'){
              changes=changes.concat(notIn(x[p][i],{},action,traversedStack));
            }
          }
        } else if(!equiv(x[p],y[p]) || 
                  (action=='addition' && !sameIDs(x,y))
                 ){
          changes.push(packChange(x, p,'single', x[p], action))
          if(isObject(x[p]) && action==='addition'){
            changes=changes.concat(notIn(x[p],y[p],action,traversedStack));
          }
        }
      }
    }
    return changes;
}

function sameIDs(a,b){
  return a[ID_FIELD]===b[ID_FIELD];
}


module.exports=Changeset;

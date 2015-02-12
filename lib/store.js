var Utils = require('./utils.js');
var ID_FIELD = Utils.ID_FIELD
var when = require('when');

var Store = function(config){
  if(config){
    if(config.id_field){ ID_FIELD = config.id_field; }
  }
  this.index = {};
};


Store.prototype.get = function(id){
  return this.index[id];
}

Store.prototype.delete = function(resource){
  delete this.index[resource[ID_FIELD]];
};

Store.prototype.listAll = function(){
  var objects = [];
  for(var id in this.index){ 
    if(this.index.hasOwnProperty(id)) {
      objects.push(this.index[id]);
    }
  }
  return objects;

};

Store.prototype.list = function(params){
  var self = this;
  return self.listAll().filter(function(resource){
    return Utils.matchesFilter(resource, params);
  });
};

function put(resource, store){
  if(!resource[ID_FIELD]){
    resource[ID_FIELD]=Utils.generateID();
  }
  store.index[resource[ID_FIELD]] = resource;
  return resource;
}

Store.prototype.applyChangeset = function(cs){
  var ob = null;
  var self = this;
  var failures = [];
  for (var i = 0; i < cs.length; i++) {
    var change = cs[i];
    var resource = this.get(change.s);
    if(!resource){
      this.index[change.s] = {};
      resource = this.index[change.s];
      resource[ID_FIELD]= change.s;
    }
    if(change.o_type=='resource'){
      ob = this.get(change.o)
      if(!ob){
        ob = {};
        ob[ID_FIELD] = change.o;
        put(ob, self);
      }
    } else { //literal
      ob = change.o;
    }
    if(change.action=='addition'){
      if(change.p_type=='array'){
        resource[change.p] = resource[change.p] || [];
        resource[change.p].push(ob);
      } else {
        resource[change.p] = ob;
      }
      //catch mismatch of p_type and existing p_type?
    } else if(change.action=='removal') {
      if(Array.isArray(resource[change.p])){
        var i = indexOf();
        if(i > -1 ){
          resource[change.p].splice(i,1);
        }
      } else if(resource[change.p]==ob) {
        delete resource[change.p];
      } else { //changeset triple did not match data
        failures.push(change);
      }
    }
  };
  return {
    success: failures.length == 0,
    failures: failures
  };
};

function indexOf(arr, item){
  var isResource = item.hasOwnProperty(ID_FIELD);
  for (var i = 0; i < arr.length; i++) {
    var current = arr[i];
    if(
        (isResource && item[ID_FIELD]==current[ID_FIELD]) 
          || (!isResource && item==current)){
      return i;
    }
  };
  return -1;
}

module.exports = Store;

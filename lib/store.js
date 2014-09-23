var Utils = require('./utils.js');
var ID_FIELD = Utils.ID_FIELD

var Store = function(){
  this.index = {};
};

Store.prototype.indexResource = function(resource,index){
  var self= this;
  index = index || {};
  if(Array.isArray(resource)){
    for(var i = 0; i < resource.length;i++){
      self.indexResource(resource[i], index);
    }
    return resource;
  } else if(typeof resource=='object' && resource){
    if(resource[ID_FIELD] && index[resource[ID_FIELD]]){
      return;
    }
    self.assignID(resource);
    index[resource[ID_FIELD]]=true;
    if(!self.get(resource[ID_FIELD])){
      self.index[resource[ID_FIELD]]=resource;
    }
    for(var p in resource){
      self.indexResource(resource[p], index);
    }
  }
};

Store.prototype.assignID = function(resource){
  if(!resource.hasOwnProperty(ID_FIELD)){
    var now = new Date();
    var epoch = new Date('2013-12-06');
    var letters = "abcdefghijklmnopqrstuvwxyz";
    var id = '';
    for(var i =0;i<4;i++){
      id+= letters.charAt(Math.floor(Math.random() * letters.length));
    }
    resource[ID_FIELD] = id + String(now.getTime() - epoch.getTime());
  }
  return resource;
};

Store.prototype.merge = function(resource, replace){
  this.assignID(resource);
  this.indexResource(resource);
  var munge= replace? Utils.replaceResourceContents : Utils.mergeResourceContents;
  munge(this.index[resource[ID_FIELD]], resource);
  return this.index[resource[ID_FIELD]];
};

Store.prototype.put = function(resource){
  return this.merge(resource, true);
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
    return self.matchesFilter(resource, params);
  });
};

Store.prototype.matchesFilter = function(resource, filter){
    for(var k in filter){
      if(!resource.hasOwnProperty(k) || resource[k]!=filter[k]){
        return false;
      }
    }
    return true;
};

Store.prototype.flatten = function(resource, index){
  var self= this;
  var firstCall = index? false : true;
  var index = index ||  {};
  var copy = {};
  if(Array.isArray(resource)){
    copy = [];
    for(var i = 0; i < resource.length;i++){
      copy[i] = self.flatten(resource[i], index);
    }
  } else if(typeof resource=='object' && resource){
    if(resource[ID_FIELD] && index[resource[ID_FIELD]]){
      return '@'+resource[ID_FIELD];
    }
    index[resource[ID_FIELD]] = copy;
    for(var p in resource){
      copy[p] = self.flatten(resource[p], index);
    }
    return firstCall? index : '@'+resource[ID_FIELD];
  } else { //string/boolean/number
    return resource;
  }
  return firstCall? index : copy;
};

Store.prototype.flattenStore = function(){
  var flatIndex = {};
  for(var id in this.index){
    if(this.index.hasOwnProperty(id)){
      this.flatten(this.get(id), flatIndex);
    }
  }
  return flatIndex;
};

Store.prototype.unflattenAndPut = function(data){
  for(var id in data){
    this.unflatten(data[id], data);
    this.put(data[id]);
  }
};

Store.prototype.unflattenAndMerge = function(data){
  for(var id in data){
    this.unflatten(data[id], data);
    this.merge(data[id]);
  }
};

Store.prototype.unflatten = function(resource, index, unflattened){ 
  var self= this
    , unflattened = unflattened || [];
  if(resource && resource[ID_FIELD] && unflattened.indexOf(resource[ID_FIELD]) != -1){
    return resource;
  } 
  if(typeof(resource)=='string' && resource[0]=='@'){
    var resource_object = index[resource.slice(1)];
    self.unflatten(resource_object, index, unflattened);
    return resource_object;
  } else if(resource && typeof(resource)=='object'){
    unflattened.push(resource[ID_FIELD]);
    for(var p in resource){
      switch(typeof(resource[p])){
        case 'object': 
          self.unflatten(resource[p], index, unflattened);
          break;
         default:
          resource[p] = self.unflatten(resource[p],index, unflattened);
          break;
      }
    }
  } else {
    return resource;
  }
};

module.exports = Store;

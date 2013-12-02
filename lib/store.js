var Store = function(){
  this.index = {};
  this.typeCount = {};
};

Store.prototype.constructID = function(type, number){
  return  type + ':' + String(number);
};

Store.prototype.assignID = function(resource){
  if(!resource.hasOwnProperty('id')){
    var type = resource.type || 'resource';
    this.typeCount[type] = this.typeCount[type] || 0;
    this.typeCount[type]++;
    resource.id = this.constructID(type, this.typeCount[type]);
  }
  return resource;
};

Store.prototype.put = function(resource){
  resource = this.assignID(resource);
  if(!this.index.hasOwnProperty(resource.id)){
     this.index[resource.id]=resource;
     return resource;
  } else {
    var current = this.index[resource.id];
    if(current==resource){
      return current;
    }
    for(var p in current){
      if(current.hasOwnProperty(p)){
        delete current[p];
      };
    }
    for(var p in resource){
      current[p] = resource[p];
    }
    return current;
  }
  
};

Store.prototype.get = function(id){
  return this.index[id];
}

Store.prototype.delete = function(resource){
  delete this.index[resource.id];
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

module.exports = Store;

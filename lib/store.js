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
  this.index[resource.id]=resource;
  return resource;
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
  return this.listAll().filter(function(obj){
    for(var k in params){
      if(!obj.hasOwnProperty(k) || obj[k]!=params[k]){
        return false;
      }
    }
    return true;
  });
}

module.exports = Store;

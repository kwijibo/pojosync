var Store = require('./store.js');
var levelgraph = require("levelgraph");
var changeset = require('./changeset.js');
var when = require('when');
var Utils = require('./utils.js');
var ID_FIELD = Utils.ID_FIELD;

function ServerStore(dbname){
  dbname = dbname || 'pojosynclevelgraph';
  this.db = levelgraph(dbname);
}

ServerStore.prototype = Object.create(Store.prototype);

ServerStore.prototype.put = function(after){
  var self = this;
  return when.promise(function(resolve,reject){
    self.get(after[ID_FIELD]).then(function(before){
      var changes = changeset(before, after);
      self.applyChangeset(changes).then(resolve).catch(reject);
    });
  });
};

//todo, use `when` library & promisify in order to collect any errors
ServerStore.prototype.applyChangeset = function(changeset){
  var self = this;
  var promises = [];
  for(var i =0; i < changeset.length ; i++){
    var change = changeset[i];
    var o_type = change.o_type || 'literal';
    var p_type = change.p_type || 'single';
    var triple = {subject: change.s, predicate: change.p, object: change.o, o_type: o_type, p_type: p_type };
    var method = change.action=='addition'? 'put' : 'del';
    var promise = (function(triple,method){
        return when.promise(function(resolve,reject){
        self.db[method](triple, function(err){
          if(err) return reject(err);
          else{
            console.log(method, "triple:", triple);
            return resolve(triple);
          }
        });
      });
    })(triple, method);
    promises.push(promise);
  }
  return when.all(promises);
};

ServerStore.prototype.get = function(uri, fetchedUris){
  var self = this;
  fetchedUris = fetchedUris || {};
  console.log("SS.get, uri:", uri, "fetched, ", fetchedUris);
  return when.promise(function(resolve,reject){
    self.db.get({subject: uri}, function(err, list){
      if(err){
        reject(err);
        return;
      }
      fetchedUris[uri] = list;
      var promises = [];

      for(var i =0; i < list.length;i++){
        var triple = list[i];
        if(triple.o_type=='resource' && !fetchedUris[triple.object]){
          promises.push(self.get(triple.object, fetchedUris));
        }
      }
      return when.all(promises).then(function(){
        resolve(list);
      });
    });
  });
}

ServerStore.prototype.list = function(params){
  console.log("serverstore list called", params);
  var self = this;
  return when.promise(function(resolve,reject){
    self._getSubjects(params).then(function(subjects){
      var results = [];
      var fetchedResources = {};
      for (var i = 0; i < subjects.length; i++){
        results.push(self.get(subjects[i], fetchedResources));
      }
      function packResults(){ 
        var triples =[];
        for(var k in fetchedResources){
          triples=triples.concat(fetchedResources[k]);
        }
        var additions = triples.map(tripleToChangeset);
        resolve({subjects: subjects, triples: additions });
      }
      when.all(results).then(packResults).catch(reject);
    });
  });
};

function tripleToChangeset(t){  
  return { action: 'addition', 
           s: t.subject, 
           p: t.predicate, 
           o: t.object,
           p_type: t.p_type,
           o_type: t.o_type 
  };
}

function subjectFromRow(row){
  return row.s;
};

ServerStore.prototype._getSubjects = function(params){
  var self = this;
  var db = self.db;
  var patterns = self._listParamsToPatterns(params);
  return when.promise(function(resolve,reject){
    db.search(patterns,function(err,solutions){
      if(err) return reject(err);
      console.log("subjects", solutions);
      var list = solutions.map(subjectFromRow);
      return resolve(list);
    });
  });
};

function isObject(item) {
  return (typeof item === "object" && !Array.isArray(item) && item !== null);
};

ServerStore.prototype._listParamsToPatterns = function(params, s){
  var self = this;
  var patterns = [];
  var s = s || 's';
  var db = self.db;
  for(var k in params){
    if(params.hasOwnProperty(k)){
        var v = params[k];
        if(isObject(v)){
          var n = s+'n';
          patterns.push({subject:db.v(s),predicate:k,object: db.v(n)});
          patterns = patterns.concat(self._listParamsToPatterns(v,n));
        } else {
          patterns.push({subject:db.v(s),predicate:k,object:v});
        }
    }
  }
  return patterns;
};

module.exports = ServerStore;

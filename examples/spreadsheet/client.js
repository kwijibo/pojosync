var pojosync = require('../../index.js');
PojoSync = new pojosync.Client(io.connect());

var D = function(tag, contents){
  var el = document.createElement(tag);
  if(contents){
    append(el, contents);
  }
  return el;
};

Spreadsheet = function(rows, columns){
  this.rows = [];
  this.type = 'Sheet';
  for (var i = 0; i < rows; i++) {
    var row = {cols:[], type: 'Row' };
    for(var j =0; j < columns; j++){
      row.cols.push({ type: 'Cell', value: ''});
    }
    this.rows.push(row);
  };
};

var SheetToHtml = function(sheet,table_id){
  var table = document.getElementById(table_id);
  var body = D('tbody');
  var head = D('thead'), headrow = D('tr');
  head.appendChild(headrow);
  table.appendChild(head);
  var width = sheet.rows[0].cols.length;
  var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for(var x=0;x<width;x++){
    var th = D('th');
    th.innerHTML = letters[x];
    headrow.appendChild(th);
  }
  for (var i = 0; i < sheet.rows.length; i++) {
    var row = sheet.rows[i];
    var tr = D('tr');
    for (var j=0;j < row.cols.length; j++) {
      var cell = row.cols[j];
      var td = D('td');
      var inpt = D('input');
      inpt.value = cell.value;
      inpt.id = cell.uri;
//      inpt.id = cell['@id'];
      inpt.onchange = (function(cell, inpt){
        return function(){
          cell.value = inpt.value;
          PojoSync.put(cell);
        };
      })(cell, inpt);
      td.appendChild(inpt);
      tr.appendChild(td);
    };
    body.appendChild(tr);
    table.appendChild(body);
  };

};

PojoSync.list({id: 'spreadsheet1'}, function(list){
  console.log(list);
  Sheet = list[0] || new Spreadsheet(50,15);
  Sheet.uri='spreadsheet1';
  PojoSync.put(Sheet);
  SheetToHtml(Sheet, 'spreadsheet');
  PojoSync.addSocketCallback(function(d){
    console.log("pojosync socket callback", d);
    for(var k in d){
      var el = document.getElementById(k);
      if(el){
        el.value = d[k].value;
      }
    }
  });
});
module.exports = {
 PojoSync: PojoSync,
 Spreadsheet: Spreadsheet
};


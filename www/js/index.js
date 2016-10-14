/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
  // Application Constructor
  initialize: function() {
    var list = [];

    var elementTemplate = function(args) {
      return ([
        '<li>',
        '<label>',
        '<input class="checkbox" type="checkbox" ' + (args.checked ? 'checked="checked"' : '') + '>',
        '<span>',
        '</span>',
        '</label>',
        '<input class="message" type="text" value="' + args.text + '">',
//     args.checkedCount,
        '<a class="up' + (args.top ? '' : ' hidden') + '" href="javascript:void(0);"></a>',
        '<a class="down' + (args.bottom ? '' : ' hidden') + '" href="javascript:void(0);"></a>',
        '<a class="remove' + (args.checked ? '' : ' hidden') + '" href="javascript:void(0);"></a>',
        '</li>'
      ]).join('');
    };

    var addElement = function(args) {
      return ([
        '<li>',
        '<a href="javascript:void(0);" class="' + (args.top ? 'top' : 'bottom') + '-add-button">',
//     '+',
        '</a>',
        '</li>'
      ]).join('');
    };

    var iterator = function(arr, f, scope) {
      result = [];
      f = (scope ? f.bind(scope) : f);
      for (var i = 0; i < arr.length; i++) {
        result.push(f(arr[i], i));
      }
      return result;
    };

    var byClass = function(css) {
      return document.getElementsByClassName(css);
    };

    var addEvent = function(target, event, f, scope) {
      f = (scope ? f.bind(scope) : f);
      if (window.addEventListener) {
        target.addEventListener(event, f, false);
      } else {
        if (window.attachEvent) {
          target.attachEvent('on' + event, f);
        }
      }
    };

    var addNewElement = function(type) {
      var items = iterator(list, function(el) {
        return el.checkedCount;
      });
      items.push(0);
      if (type == 'top') {
        list.unshift({
          checked: false,
          text: '',
          checkedCount: Math.max.apply(null, items) + 1
        });
      }
      if (type == 'bottom') {
        list.push({
          checked: true,
          text: '',
          checkedCount: Math.min.apply(null, items) - 1
        });
      }
      redrawList();
    };

    var redrawList = function() {
      document.body.innerHTML = '';
      drawList();
    };

    var drawList = function() {
      document.body.innerHTML += '<ul>' + (list.length > 0 ? addElement({top: true}) + iterator(
          (function() {
            list = iterator(list, function(el) {
              el.top = true;
              el.bottom = true;
              return el;
            });
            var a = list.filter(function(el) {
              return !el.checked;
            }).sort(function(a, b) {
              return b.checkedCount - a.checkedCount;
            });
            var b = list.filter(function(el) {
              return el.checked;
            }).sort(function(a, b) {
              return b.checkedCount - a.checkedCount;
            });
            if (a[0]) {a[0].top = false;}
            if (b[0]) {b[0].top = false;}
            if (a[a.length - 1]) {a[a.length - 1].bottom = false;}
            if (b[b.length - 1]) {b[b.length - 1].bottom = false;}
            a.push.apply(a, b);
            list = a;//iterator(a, function(el,index){el.checkedCount = ~index; return el;});
            return a;
          })(),
          elementTemplate
        ).join('') + addElement({top: false}) : addElement({top: true}));
      iterator(byClass('top-add-button'), function(el) {
        addEvent(el, 'click', function() {
          addNewElement('top');
        });
      });
      iterator(byClass('bottom-add-button'), function(el) {
        addEvent(el, 'click', function() {
          addNewElement('bottom');
        });
      });
      iterator(byClass('up'), function(el, index) {
        addEvent(el, 'click', function() {
          var t = list[index].checkedCount;
          list[index].checkedCount = list[index - 1].checkedCount;
          list[index - 1].checkedCount = t;
          redrawList();
        });
      });
      iterator(byClass('down'), function(el, index) {
        addEvent(el, 'click', function() {
          var t = list[index].checkedCount;
          list[index].checkedCount = list[index + 1].checkedCount;
          list[index + 1].checkedCount = t;
          redrawList();
        });
      });
      iterator(byClass('remove'), function(el, index) {
        addEvent(el, 'click', function() {
          list.splice(index, 1);
          redrawList();
        });
      });
      iterator(byClass('message'), function(el, index) {
        addEvent(el, 'change', function() {
          list[index].text = el.value;
          updateDB();
        });
      });
      iterator(byClass('checkbox'), function(el, index) {
        addEvent(el, 'change', function() {
          list[index].checked = !list[index].checked;
          if (list[index].checked) {
            list[index].checkedCount++;
          }
          redrawList();
        });
      });

      updateDB();


    };

    var updateDB = function () {

      db.transaction(function(tx) {

        tx.executeSql('DELETE FROM DEMO WHERE 1');


        for (var f = 0; f < list.length; f++) {
          tx.executeSql('INSERT INTO DEMO (checked, text, count) VALUES (' + (list[f].checked ? '1' : '0') + ', "' + list[f].text + '", ' + list[f].checkedCount.toString() + ')');
        }

      }, function(err) {
        alert("Error processing SQL: " + err.code);
      });
    };


    var db = window.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);
    db.transaction(function(tx) {
      // populate
      //tx.executeSql('DROP TABLE IF EXISTS DEMO');
      tx.executeSql('CREATE TABLE IF NOT EXISTS DEMO (checked, text, count)');
      //tx.executeSql('INSERT INTO DEMO (checked, text, count) VALUES (0, "First row", 1)');
      //tx.executeSql('INSERT INTO DEMO (checked, text, count) VALUES (1, "Second row", 1)');
    }, function(tx, err) {
      // error
      alert("Error processing SQL: " + err);
    }, function() {
      // success
      var db = window.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);
      db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM DEMO', [], function(tx, results) {
          var len = results.rows.length;
          console.log("DEMO table: " + len + " rows found.");
          for (var i = 0; i < len; i++) {
            //console.log("Row = " + i + " checked = " + results.rows.item(i).checked + " text =  " + results.rows.item(i).text + " count =  " + results.rows.item(i).count);
            list.push({
              checked: results.rows.item(i).checked == 1,
              text: results.rows.item(i).text,
              checkedCount: results.rows.item(i).count
            });
          }
          drawList();
        }, function(err) {
          alert("Error processing SQL: " + err.code);
        });
      }, function(err) {
        alert("Error processing SQL: " + err.code);
      });

    });

  },
  //// Bind Event Listeners
  ////
  //// Bind any events that are required on startup. Common events are:
  //// 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    //    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  //// deviceready Event Handler
  ////
  //// The scope of 'this' is the event. In order to call the 'receivedEvent'
  //// function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    //    app.receivedEvent('deviceready');
  },
  //// Update DOM on a Received Event
  receivedEvent: function(id) {
    //    var parentElement = document.getElementById(id);
    //    var listeningElement = parentElement.querySelector('.listening');
    //    var receivedElement = parentElement.querySelector('.received');
    //
    //    listeningElement.setAttribute('style', 'display:none;');
    //    receivedElement.setAttribute('style', 'display:block;');
    //
    //    console.log('Received Event: ' + id);
  }
};

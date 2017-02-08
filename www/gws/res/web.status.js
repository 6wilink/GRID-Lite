// 6Harmonics Qige
// 2017.01.05
var _version = 'WebUI (v3.0.050117)';
var _author = 'Designed by 6WiLink Qige';
var _address = 'Address: Suit 3B-1102/1105, Z-Park, Haidian Dist., Beijing, China';

// global data
var store = {
  mode: 'demo',
  flag: {
    ajaxUpdate: null,
    afterReboot: null,    
  },
  offlineCounter: 0,
  offlineCounterBar: 6,
  peity: {
    bb: null,
    nw: { total: null, wan: null, lan: null, wlan: null }
  } 
};

// window.location.href
(function($) {
	$.url = {
		get: function(key) {
			var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
			var r = window.location.search.substr(1).match(reg);
			if (r != null) return unescape(r[2]); return null;
		},
		goto: function(url, reason) {
      if (confirm('Will leave current page due to ' + reason)) {
        $(window.location).attr('href', url);
      }
		},
    check: function(url, reason) {
      if (store.offlineCounter == store.offlineCounterBar)
        $.url.goto(url, reason);
    },
    reload: function() {
      window.location.reload();
    },
    close: function() {
      window.opener = null; window.open(".", "_self"); window.close();
      if (window) { window.location.href = "about: blank"; }
    }
	};
}) (jQuery);

// Peity line/bar/pie/donut
(function($) {
  $.peity = {
    init: function() {
      //$('.peity-bb').peity('line', { width: 64 });
      store.peity.nw.total = $('#peity-nw-total').peity('line', { width: 64 });
      store.peity.nw.wan = $('#peity-nw-wan').peity('line', { width: 64 });
      store.peity.nw.lan = $('#peity-nw-lan').peity('line', { width: 64 });
      store.peity.nw.wlan = $('#peity-nw-wlan').peity('line', { width: 64 });      
    },
    one: function(obj, value) {
      var values = obj.text().split(',');
      if (values.length > 20) values.shift();
      values.push(value);
      obj.text(values.join(',')).change();
    },
    nw: { 
      total: function(value) {
        $.peity.one(store.peity.nw.total, value);
      },
      wan: function(value) { 
        $.peity.one(store.peity.nw.wan, value);
      },
      lan: function(value) {
        $.peity.one(store.peity.nw.lan, value);
      },
      wlan: function(value) {
        $.peity.one(store.peity.nw.wlan, value);
      }
    }
  }
}) (jQuery);

// Application
(function($) {
  $.app = {
    ops: {
      init: function(_mode) {
        // default mode = 'demo'
        store.mode = _mode;
        
        // init peity charts
        $.peity.init();
        
        // disable right-button menu
        $(document).on('contextmenu', function() {
          return false;
        });

        // hide/show blocks
        $('#btn-dev-status-baseband').click(function() {
          $('#div-dev-status-baseband').fadeToggle();
        });
        $('#btn-dev-status-gws').click(function() {
          $('#div-dev-status-gws').fadeToggle();
        })
        $('#btn-dev-status-nw').click(function() {
          $('#div-dev-status-nw').fadeToggle();
        });
        
        $('#btn-logo').click(function() { 
          $.app.ops.miniToggle();
        });
        $(window).load(function() {
          if ($(window).width() <= 910) $.app.ops.mini();
        }).resize(function() {
          if ($(window).width() <= 910) $.app.ops.mini();
        });
        
        $('#btn-dev-reboot').click(function() {
          if (confirm('Click "OK" if you want to REBOOT this device')) {
            $.get('/cgi-bin/data?k=reboot', function() {
              console.log('WARNING: Rebooting ...');
              clearInterval(store.flag.ajaxUpdate);
              // close tab/window/about or reload after 45 seconds
              store.flag.afterReboot = setTimeout($.app.reload(), 45000);
              //$.app.close();
            })
          }
        });
      },
      reload: function() { $.url.reload(); },
      close: function() { $.url.close(); },
      miniToggle: function() {
        $('.sidebar').fadeToggle();
        $('.page').toggleClass('page-margin');      
      },
      mini: function() {
        $('.sidebar').fadeOut();
        $('.page').removeClass('page-margin');                      
      },      
    },
    data: {
      apply: {
        basic: function(data) {
          $('#basic-sn').text(data['sn']); $('#basic-model').text(data['model']);
          $('#basic-ip').text(data['ip']); $('#basic-mac').text(data['mac']);
        },
        gws: function(data) {
          var r = data['rgn'], ch = data['ch'], bw = data['bw'];
          var f = (r == 0) ? (473+(ch-14)*6) : (474+(ch-21)*8);
          var msg = 'R'+r+', '+bw+'M, CH'+ch+', '+f+'M';
          
          $('#kpi-gws-rx').text(data['rx']); $('#kpi-gws-mode').text(data['mode']);
          $('#kpi-gws-tx').text(data['tx']); $('#kpi-gws-ch').text(msg);
        },
        bb: function(data) {
          // add/remove STA when STAs changed
          var obj = $('#table-kpi-bb');
          if (data.length > 0) {
            var text = '';
            for(var i = 0; i < data.length; i ++) {
              var dev = data[i];
              var signal = dev.signal;
              if (signal != 0) {
                var noise = dev.noise;
                var snr = signal - noise;
                if (snr < 0) snr = 0;
                text += '<tr>';
                text += '<td>'+dev.peer+'</td>';
                text += '<td>'+dev.remote+'</td>';
                text += '<td>'+snr+' / '+signal+' / '+noise+' dBm</td>';
                text += '<td>'+dev.rx+'<br />'+dev.tx+'</td>';
                text += '<td>'+dev.inactive+' ms</td>';
                text += '</tr>';                
              }
            };
            obj.find('tbody').empty().html(text);
          } else {
            obj.find('tbody').empty().html('<tr><td colspan="5">(not connected)</td></tr>');
          }
        },
        nw: function(data) {        
          $('#kpi-nw-total').text(data['total']); $.peity.nw.total(data['total']);
          $('#kpi-nw-wan').text(data['wan']+''); $.peity.nw.wan(data['wan']);
          $('#kpi-nw-lan').text(data['lan']); $.peity.nw.lan(data['lan']);
          $('#kpi-nw-wlan').text(data['wlan']); $.peity.nw.wlan(data['wlan']);
        }
      },
      sync: {
        basic: function() {
          if (store.mode == 'realtime') {
            $.ajaxSetup({ timeout: 3000 });
            $.get('/cgi-bin/data', { k: 'basic' }, function(data) {
              if (typeof(data) != 'undefined') {
                if (typeof(data['error'] != 'undefined') && data['error']) {
                  console.log('ERROR: basic data request failed -> ' + data['error']);
                  $.url.check('/wui/', 'Device may offline (basic) OR rebooted');
                } else {
                  store.offlineCounter = 0;
                  $.app.data.apply.basic(data);                              
                }
              }
            }, 'json').fail(function() {
              console.log('ERROR: basic data request failed.');
              $.url.check('/wui/', 'Please login first');
            });
          } else {
            var data = $.app.data.demo.basic();
            $.app.data.apply.basic(data);
          }
        },
        intl: function() {
          if (store.mode == 'realtime') {
            $.ajaxSetup({ timeout: 3000 });
            $.get('/cgi-bin/data', { k: 'kpi' }, function(data) {
              if (typeof(data) != 'undefined' && data) {
                if (typeof(data['error'] != 'undefined') && data['error']) {
                  console.log('ERROR: kpi data request failed -> ' + data['error']);
                  store.offlineCounter ++;
                  $.url.check('/wui/', 'Device may offline (kpi) OR rebooted');
                } else {
                  store.offlineCounter = 0;
                  if (typeof(data['bb']) != 'undefined') $.app.data.apply.bb(data['bb']);
                  if (typeof(data['nw']) != 'undefined') $.app.data.apply.nw(data['nw']);
                  if (typeof(data['ap']) != 'undefined') $.app.data.apply.ap(data['ap']);
                  if (typeof(data['gws']) != 'undefined') $.app.data.apply.gws(data['gws']);
                }
              }
            }, 'json')
            .fail(function() {
              console.log('ERROR: kpi data request failed.');
              store.offlineCounter ++;
              $.url.check('/wui/', 'Device may offline (kpi) OR rebooted');
            });
          } else {
            var data = $.app.data.demo.update();          
            $.app.data.apply.gws(data['gws']);
            $.app.data.apply.bb(data['bb']);
            $.app.data.apply.nw(data['nw']);
            //$.app.data.apply.ap(data['ap']);      
          }        
        },
      },
      demo: {
        basic: function() {
          var data = { model: 'ARN4433P8QZ', sn: '1701CNBJ01001', mac: 'AB:CD:EF:01:23:45', ip: '192.168.1.211/255.255.255.0' };
          return data;
        },
        update: function() {
          var nw = (Math.round(Math.random()*10+Math.random()*30)/10).toFixed(3);
          var nwRate = (Math.round(Math.random()*10)/10).toFixed(1);
          var data = {
            bb: [{
              peer: 'AB:CD:EF:01:23:66',
              remote: '192.168.1.212',
              signal: Math.round(-75 + Math.random() * 10),
              noise: Math.round(-107 + Math.random()),
              rx: '28.50 Mbps (7s)',
              tx: '25.6 Mbps (7)',
              inactive: Math.round(Math.random()*1500)
            },
            {
              peer: 'AB:CD:EF:01:23:88',
              remote: '192.168.1.213',
              signal: Math.round(-75 + Math.random() * 10),
              noise: Math.round(-107 + Math.random()),
              rx: '20.1 Mbit/s (5s)',
              tx: '24.6 Mbit/s (6s)',
              inactive: Math.round(Math.random()*1500)
            }],
            gws: {
              mode: 'CAR (bridged, WDS AP)',
              rgn: 1,
              ch: Math.round(Math.random() * (60-21) + 21),
              bw: 8,
              rx: 'gain = 10 (max 12)',
              tx: '30 dBm (ON, 1 W)'
            },
            nw: {
              total: nw,
              wan: 0,
              lan: (nw * nwRate).toFixed(3),
              wlan: (nw * (1 - nwRate)).toFixed(3)
            },
            ap: [{
              total: 0.002, tx: 0.001, rx: 0.001
            },
            {
              total: 0.002, tx: 0.001, rx: 0.001
            }]
          };
          return data;
        }
      }
    },
    run: function(_mode) {
      $.app.ops.init(_mode);
      $.app.data.sync.basic();
      if (! store.flag.ajaxUpdate) {
        $.app.data.sync.intl();
        store.flag.ajaxUpdate = setInterval("$.app.data.sync.intl()", 2000);
      }
    }
  }
}) (jQuery);


// Web Application
// by Qige @ 2017.01.05/2017.01.10
console.log(_version, _author, _address);

// read mode from url
_mode = $.url.get('k') || 'demo';
$.app.run(_mode);
console.log('App Running Mode: '+_mode);

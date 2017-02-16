// 6Harmonics Qige
// 2017.01.05/2017.01.10
var _version = 'WebUI (v3.0.100117)';
var _author = 'Designed by 6WiLink Qige';
var _address = 'Address: Suit 3B-1102/1105, Z-Park, Haidian Dist., Beijing, China';

// global data
var store = {
  ui: {
    sec: 'gws'
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

// Application
(function($) {
  $.app = {
    init: function(_sec) {
      // default sec = 'gws'
      store.ui.sec = _sec;
      $.app.ui();
      
      // disable right-button menu
      $(document).on('contextmenu', function() {
        return false;
      });
      
      // hide/show blocks
      $('.btn-dev-set').click(function() {
        store.ui.sec = $(this).attr('data');
        $.app.ui();
      });
      
      $('#btn-logo').click(function() { $.app.miniToggle(); });
      $(window).load(function() {
        if ($(window).width() <= 910) { $.app.mini(); }        
      }).resize(function() {
        if ($(window).width() <= 910) { $.app.mini(); }
      });
      
      $('#btn-dev-cli-do').click(function() {
        var _this = $('#btn-dev-cli-do');
        var cmd = $('#input-dev-cli').val();
        $.post('/cgi-bin/data?k=cmd', { cmd: cmd }, function(resp) {
          $('#input-dev-cli').removeClass('error').addClass('primary');
          $('#input-dev-cli-resp').text(resp);
          _this.removeClass('primary').addClass('primary');
        })
        .fail(function() {
          var _this = $('#btn-dev-cli-do');
          console.log(' cmd failed ');
          $('#input-dev-cli').removeClass('primary').addClass('error');
          $('#input-dev-cli-resp').text('* cmd failed *');
          _this.removeClass('primary').addClass('error');
        });
      });
      $('#input-dev-cli').keydown(function(event) {
        if (event.which == 13) {
          $('#btn-dev-cli-do').trigger('click');
          $('#input-dev-cli').trigger('blur');
        }
      })
      .focus(function() {
        $(this).select();
      });
      
      $('#btn-dev-reboot').click(function() {
        if (confirm('Click "OK" if you want to REBOOT this device')) {
          $.get('/cgi-bin/data?k=reboot', function() {
            console.log('WARNING: Rebooting ...');
            clearInterval(store.intlAjaxUpdate);
            // close tab/window/about or reload after 45 seconds
            setTimeout($.app.reload(), 45000);
            //$.app.close();
          })
        }
      });
      
      $('#btn-dev-factory').click(function() {
        if (confirm('Click "OK" if you want to RESTORE this device back to FACTORY Load')) {
          $.get('/cgi-bin/data?k=factory', function() {
            console.log('WARNING: Restoring to FACTORY Load ... Please wait');
            clearInterval(store.intlAjaxUpdate);
            // close tab/window/about or reload after 45 seconds
            setTimeout($.app.reload(), 60000);
            //$.app.close();
          })
        }
      });
    },
    reload: function() { window.location.reload(); },
    close: function() {
      window.opener = null; window.open(".", "_self"); window.close();
      if (window) { window.location.href = "about: blank"; }
    },
    miniToggle: function() {
      $('.sidebar').fadeToggle();
      $('.page').toggleClass('page-margin');      
    },
    mini: function() {
      $('.sidebar').fadeOut();
      $('.page').removeClass('page-margin');                      
    },
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
        // todo: add/remove STA when STAs changed
        // generate random value
        //console.log('$.app.apply.bb()'); console.dir(data);
        if (data.length > 0) {
          var text = '';
          $('#table-kpi-bb').find('tbody').empty();
          for(var i = 0; i < data.length; i ++) {
            var snr = data[i].signal - data[i].noise;
            if (snr < 0) snr = 0;
            text += '<tr>';
            text += '<td>'+data[i].peer+'</td>';
            text += '<td>'+data[i].remote+'</td>';
            text += '<td>'+data[i].signal+'/'+data[i].noise+'/'+snr+'</td>';
            text += '<td>'+data[i].rx+'<br />'+data[i].tx+'</td>';
            text += '<td>'+data[i].inactive+'</td>';
            text += '</tr>';
          };
          $('#table-kpi-bb').find('tbody').html(text);
        } else {
          $('#table-kpi-bb').find('tbody').empty();
        }
      },
      nw: function(data) {        
        // generate random value
        //$('#kpi-nw-total').text(data['total']); $.peity.nw.total(data['total']);
        //$('#kpi-nw-wan').text(data['wan']+''); $.peity.nw.wan(data['wan']);
        //$('#kpi-nw-lan').text(data['lan']); $.peity.nw.lan(data['lan']);
        //$('#kpi-nw-wlan').text(data['wlan']); $.peity.nw.wlan(data['wlan']);
      }
    },
    sync: {
      basic: function() {
        //console.log('ajax fetch data from /cgi-bin/data?k=basic');
        $.ajaxSetup({ timeout: 3000 });
        //$.get('/cgi-bin/data', { k: 'basic' }, function(data) {
          data = $.app.demo.basic();
          if (typeof(data) != 'undefined') {
            if (typeof(data['error'] != 'undefined') && data['error']) {
              console.log('ERROR: basic data request failed -> ' + data['error']);
              $.url.check('/wui/', 'Device may offline (basic) OR rebooted');
            } else {
              store.offlineCounter = 0;
              $.app.apply.basic(data);                              
            }
          }
        //}, 'json').fail(function() {
          //console.log('ERROR: basic data request failed.');
          //$.url.check('/wui/', 'Please login first');
        //});
      },
      intl: function() {
        //console.log('ajax fetch data from /cgi-bin/data?k=kpi');
        $.ajaxSetup({ timeout: 3000 });
        //$.get('/cgi-bin/data', { k: 'kpi' }, function(data) {
          data = $.app.demo.update();
          if (typeof(data) != 'undefined' && data) {
            if (typeof(data['error'] != 'undefined') && data['error']) {
              console.log('ERROR: kpi data request failed -> ' + data['error']);
              store.offlineCounter ++;
              $.url.check('/wui/', 'Device may offline (kpi) OR rebooted');
            } else {
              store.offlineCounter = 0;
              if (typeof(data['bb']) != 'undefined') $.app.apply.bb(data['bb']);
              if (typeof(data['nw']) != 'undefined') $.app.apply.nw(data['nw']);
              if (typeof(data['ap']) != 'undefined') $.app.apply.ap(data['ap']);
              if (typeof(data['gws']) != 'undefined') $.app.apply.gws(data['gws']);
            }
          }
        //}, 'json')
        //.fail(function() {
          //console.log('ERROR: kpi data request failed.');
          //store.offlineCounter ++;
          //$.url.check('/wui/', 'Device may offline (kpi) OR rebooted');
        //});
      },
    },
    run: function(_sec) {
      $.app.init(_sec);
      $.app.sync.basic();
      if (! store.intlAjaxUpdate) {
        //$.app.sync.intl();
        //store.intlAjaxUpdate = setInterval("$.app.sync.intl()", 2000);
      }
    },
    ui: function() {
      var _sec = store.ui.sec;      

      $('.set-sec').hide();
      switch(_sec) {
        case 'cli':
          $('#div-dev-set-cli').show();
          var obj = $('#input-dev-cli'); var cmd = obj.val();
          obj.val('').focus().val(cmd).select();
          break;
        case 'factory':
          $('#div-dev-set-factory').show();
          break;
        case 'sys':
          $('#div-dev-set-sys').show();
          break;
        case 'nw':
          $('#div-dev-set-nw').show();
          break;
        case 'serv':
          $('#div-dev-set-serv').show();
          break;
        case 'gws':
        default:
          $('#div-dev-set-gws').show();
          break;
      };
    },
    demo: {
      basic: function() {
        var data = { model: 'ARN4433P8C', sn: '1701CNBJ01002', mac: '00:5E:AC:00:5E:AF', ip: '192.168.1.211/255.255.255.0' };
        return data;
      },
      update: function() {
        var nw = (Math.round(Math.random()*10+Math.random()*30)/10).toFixed(3);
        var nwRate = (Math.round(Math.random()*10)/10).toFixed(1);
        var data = {
          bb: [{
            ssid: 'gws5000',
            ifname: 'wlan0',
            wds: true,
            mode: 1,
            encrypt: 'psk2',
            key: '6Harmonics'
          }],
          gws: {
            mode: {
              val: 2,
              desc: 'CAR (bridged, WDS AP)'
            },
            rgn: 1,
            ch: Math.round(Math.random() * (60-21) + 21),
            bw: {
              val: 8,
              unit: 'MHz'
            },
            rx: {
              gain: 10,
              max: 12,
              unit: 'dbi'
            },
            tx: {
              power: 30,
              unit: 'dBm'
            }
          },
          nw: [{
            ifname: 'br-lan',
            mac: '00:5E:AC:00:5E:AD',
            type: 'loopback'
          },{
            ifname: 'lo',
            mac: '00:5E:AC:00:5E:AD',
            type: 'brif'
          },{
            ifname: 'lan',
            mac: '00:5E:AC:00:5E:AD',
            type: 'if',
            brname: 'br-lan'
          },{
            ifname: 'wlan0',
            mac: '00:5E:AC:00:5E:AF',
            type: 'if',
            brname: 'br-lan'
          }]
        };
        return data;
      }
    }
  }
}) (jQuery);


// Web Application
// by Qige @ 2017.01.09
console.log(_version, _author, _address);

// read mode, section from url
_sec = $.url.get('s') || 'gws';
$.app.run(_sec);
console.log('App Running Mode: ' + _sec);

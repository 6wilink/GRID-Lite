// by 6Harmonics Qige @ 2017.02.22

// data controller
(function($) {
	$.cache = {
		// ...
		init: function() {
		},
		// get random value
		RANDOM: {
			int: function(range) {
				return Math.round(Math.random() * (range | 10));
			}
		},
		stop: function() {
			store.flot.intl.each(function() {
				if ($(this)) clearInterval($(this));
			});
		},
		// clear chart data when click "CLEAR" button
		clear: {
			local: function() {
				store.history.local.length = 0;
			}
		},
		// format object
		fmt: {
			// TODO: format device data into object
			dev: function(data) {
				var dev = {};
				//if (data) {
					/*dev.bridge = data.bridge ? data.bridge : 0;
					dev.mac = $.cache.fmt.val(data, 'mac', '');
					dev.wan_ip = $.cache.fmt.val(data, 'wan_ip', '');
					dev.wan_txb = $.cache.fmt.val(data, 'wan_txb', 0);
					dev.wan_rxb = $.cache.fmt.val(data, 'wan_rxb', 0);
					dev.lan_ip = $.cache.fmt.val(data, 'lan_ip', '');
					dev.lan_txb = $.cache.fmt.val(data, 'lan_txb', 0);
					dev.lan_rxb = $.cache.fmt.val(data, 'lan_rxb', 0);*/
				//}
				return data;	
			},
			// 
			history: function(data) {
				var his = {
					wan_tx: 0,
					wan_rx: 0,
					lan_tx: 0,
					lan_rx: 0,
					snr: 0,
					mcs_tx: 0,
					mcs_rx: 0
				};
				return his;
			}
		},
		// ajax query
		query: {
			// 'demo' mode
			DEMO: function(idx) {
				var data = {
					//bridge: 0,
					mac: '10:00:00:00:00:0'+idx,
					wan_ip: '10.10.1.2'+idx,
					wan_txb: $.cache.RANDOM.int(1024),
					wan_rxb: $.cache.RANDOM.int(1024),
					lan_ip: '192.168.1.2'+idx,
					lan_txb: $.cache.RANDOM.int(1024),
					lan_rxb: $.cache.RANDOM.int(1024)
				};
				var dev = $.cache.fmt.dev(data);
				return dev;
			}
		},
		// start ajax/proxy query
		sync: {
			local: function() {
				// TODO: call & handle ajax fails 
				$.get('/cgi-bin/get', { k: 'sync' }, function(resp) {
					console.log('get?k=sync'); console.dir(resp);
				}, 'json')
				.fail(function() {
					console.log('get?k=sync', "error> local sync failed");
				});
			},
			// proxy query
			peers: function() {
				// TODO: call & handle ajax fails
				$.get('/cgi-bin/proxy', { ip: '', cmd: 'cache' }, function(resp) {
				}, 'json')
				.fail(function() {
					console.log("error> peers sync failed");
				});
			},
			// generate DEMO data
			DEMO: function() {
				var demo = {
					local: $.cache.query.DEMO(0),
					peers: [ $.cache.query.DEMO(1), $.cache.query.DEMO(2) ]
				};
				console.dir(demo);

				// save last cache
				var demo_last = store.query.cache;
				store.query.cache = demo;
				if (demo_last) {
					store.query.cache_last = demo_last;
				}
			}
		},


		// parse store.query.cache,
		// save store.history;
		parse: {
			// TODO: parse data with DEMO
			local: function() {
				var local = [];
				if (store.query.cache) {
					var history = store.history;
					if (history && typeof(history.local) != 'undefined') {
						local = history.local;
					}

					var thrpt, snr, txmcs, rxmcs;
					//history.push(Math.random()*1024);
					thrpt = $.flot.one(local.thrpt, Math.round(Math.random() * 26), 60);
					snr = $.flot.one(local.snr, 35 + Math.round(Math.random() * 5), 60);
					txmcs = $.flot.one(local.txmcs, 3+Math.round(Math.random()*2), 60);
					rxmcs = $.flot.one(local.rxmcs, 2+Math.round(Math.random()*2), 60);
					//var local = store.query.cache.local;
					//var local_last = store.query.cache_last.local;

					//var fmt_local = $.cache.fmt.history(local);
					//var fmt_local_last = $.cache.fmt.history(local_last);

					//var history = store.history.local;
					//history.wan_tx.push(local.wan_txb - local_last.wan_txb);
					//history.wan_rx.push(local.wan_rxb - local_last.wan_rxb);					
					store.history = {
						local: {
							snr: snr,
							thrpt: thrpt,
							txmcs: txmcs,
							rxmcs: rxmcs
						}
					}
				}

				store.query.cache.local_last = store.query.cache.local;
				store.query.cache.local = null;
			},
			peers: function() {
				var peers = store.query.cache.peers;
			}
		},

		// "realtime" update
		update: function() {
			// main data sync sequences
			$.cache.sync.local();
			//$.cache.parse.local();
			//$.cache.sync.peers();
			//$.cache.parse.peers();
		},
		// 'demo' mode entry
		// TODO: parse & save "store.cache" into "store.history"
		DEMO: function() {
			$.cache.sync.DEMO();
			$.cache.parse.local();
			$.cache.parse.peers();
		},
	}
}) (jQuery); // $.cache


// ui controller
// @2017.02.22
(function($) {
	$.ui = {
		init: function() {
			$.materialize.init();
			$.flot.init();
			$.ui.forms();
		},
		update: function() {
			$.flot.sync();
		},
		forms: function() {
			$('form').submit(function() {
				return false;
			});
		}
	}
}) (jQuery); // $.ui


// Bind & handle all "EVENT"
// TODO: this page not finished yet
// @2017.02.22
(function($) {
	$.ops = {
		init: function() {
			$('#qz-local-reset').click(function() {
				$.cache.clear.local();
			});
			$('#qz-btn-sys-reset').click(function() {
				$('#qz-modal-chcfm-items').text('Reset Network');
				$('#qz-modal-chcfm-affected').text('This Operation Will REBOOT This Device');
				$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'sys');
			});

			$('#qz-btn-abb-reset').click(function() {
				$('#qz-modal-chcfm-items').text('Reset Analog Baseband');
				$('#qz-modal-chcfm-affected').text('This Operation Will Interrupt Your Current Wireless Communication');
				$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'abb');
			});

			$('#qz-btn-gws-reset').click(function() {
				$('#qz-modal-chcfm-items').text('Reset GWS');
				$('#qz-modal-chcfm-affected').text('This Operation Will Interrupt Your Current Wireless Communication');
				$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'gws');
			});

			$('#qz-btn-nw-reset').click(function() {
				$('#qz-modal-chcfm-items').text('Reset Network');
				$('#qz-modal-chcfm-affected').text('This Operation Will Interrupt Your Current Network Communication, including Wireless Communication');
				$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'nw');
			});

			$('#qz-btn-fw-factory').click(function() {
				$('#qz-modal-chcfm-items').text('Reset to FACTORY SETTINGS');
				$('#qz-modal-chcfm-affected').text('This Operation Will RESET This Device to FACTORY SETTINGS !');
				$('#qz-btn-confirm-change').attr('ops', 'init').attr('val', 'new');
			})

			$('#qz-btn-confirm-change').click(function() {
				var ops = $(this).attr('ops');
				var val = $(this).attr('val');
				console.log('ops>', ops, val);

				var url = '/cgi-bin/' + ops;
				if (val) {
					url += ('?k=' + val);
				}

				$.ops.ajax(val, url, null);
			});

			$(':text').keydown(function(e) {
				if (e.keyCode == 13) {
					var obj = $(this);
					obj.qz = {
						_com: obj.attr('alt'),
						_item: obj.attr('name'),
						_val: obj.val()
					};
					$.ops.change(obj);
				}
			});
			$(':checkbox').click(function() {
				var obj = $(this);
				var current = (obj.attr('checked') == 'checked') || false;
				if (current) {
					obj.removeAttr('checked');
				} else {
					obj.attr('checked', true);
				}

				obj.qz = {
					_com: obj.attr('alt'),
					_item: obj.attr('name'),
					_val: (obj.attr('checked') == 'checked') ? 'on' : 'off'
				};

				if (obj.qz._com != 'undefined' && obj.qz._item != 'undefined') {
					$.ops.change(obj);
				}
			});
			$('select').change(function() {
				var obj = $(this);
				obj.qz = {
					_com: obj.attr('alt'),
					_item: obj.attr('name'),
					_val: obj.val()
				};
				$.ops.change(obj);
			})
		},
		change: function(obj) {
			if (obj.qz._val != '' && obj.qz._val != '-') {
				console.log('enter >', obj.qz._com, obj.qz._item, obj.qz._val);
				
				// prevent multi-submit
				obj.attr('disabled', true);

				$.ops.ajax('Save', '/cgi-bin/set', {
					com: obj.qz._com, item: obj.qz._item, val: obj.qz._val
				});

				obj.attr('disabled', false);
			}
		},
		ajax: function(ops, url, params) {
			var prompt = '';
			$.get(url, params, function(resp) {
				switch(ops) {
				case 'abb':
					prompt = 'ABB has been RESET';
					break;
				case 'gws':
					prompt = 'GWS has been RESET';
					break;
				case 'nw':
					prompt = 'Network has been RESET';
					break;
				case 'sys':
					prompt = 'Device is REBOOTING';
					break;
				default:
					prompt = 'Operation completed';
					break;
				}
				console.log(prompt);

				$.materialize.toast(prompt);

				// reset nw: reload
				// reset sys: close
				$.ops.ajax_done(ops);
			})
			.fail(function(resp) {
				switch(ops) {
				case 'nw':
					prompt = 'Network has been RESET';
					break;
				case 'sys':
					prompt = 'Device is REBOOTING';
					break;
				default:
					prompt = 'Operation failed > ' + ops;
					break;
				}
				console.log(prompt);
				
				$.materialize.toast(prompt);

				// reset nw: reload
				// reset sys: close
				$.ops.ajax_done(ops);
			});
		},
		ajax_done: function(ops) {
			switch(ops) {
			case 'nw':
				$.materialize.toast('Reload this page due to Device Network is RESET');
				setTimeout("$.url.reload()", 3000);
				break;
			case 'sys':
				$.materialize.toast('Closing this page due to Device is REBOOTING', 5000);
				setTimeout("$.url.goto('/', 'Reboot')", 5000);
				break;
			default:
				break;
			}
		}
	}
}) (jQuery); // $.ops

// app algorithm
// @ 2017.02.22
(function($) {
	$.app = {
		init: function(mode) {
			store.mode = mode;
			$.ui.init();
			$.cache.init();
			$.ops.init();
		},
		// update store.query.cache with "ajax"
		update: function() {
			$.cache.update();
			$.ui.update();
		},
		// update store.query.cache with "DEMO"
		DEMO: function() {
			$.cache.DEMO();
			$.ui.update();
		},
		run: function(mode) {
			// init cache/data, ui
			$.app.init(mode);
			switch(mode) {
			case 'realtime':
				console.log("App Running (realtime).");
				// main loop
				$.app.update();
				store.flot.intl.local = setInterval("$.app.update", 1500);
				break;
			case 'demo':
			default:
				console.log("App Running in DEMO mode.");
				$.app.DEMO();
				store.flot.intl.DEMO = setInterval("$.app.DEMO()", 800);
				break;
			}
		}
	}
}) (jQuery); // $.app


// app starts here
// @2017.02.22
$(function() {
	var m = $.url.get('k') || 'demo';
	$.app.run(m);
});


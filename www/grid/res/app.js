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
				$.get('/cgi-bin/cache', function(resp) {
					//
				}, 'json')
				.fail(function() {
					console.log("error> local sync failed");
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

					var thrpt, snr;
					//history.push(Math.random()*1024);
					thrpt = $.flot.one(local.thrpt, Math.round(Math.random() * 26), 60);
					snr = $.flot.one(local.snr, 20 + Math.round(Math.random() * 5), 60);
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
							thrpt: thrpt
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
			//$.cache.sync.local();
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
			})
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
				store.flot.intl.DEMO = setInterval("$.app.DEMO()", 2000);
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


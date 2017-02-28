// by 6Harmonics Qige @ 2017.02.22

// data controller
(function($) {
	$.cache = {
		// ...
		init: function() {
		},
		// get random value
		RANDOM: { // 2017.02.28
			int: function(range) { // 2017.02.28
				return Math.round(Math.random() * (range || 10));
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
		// ajax query
		query: { // 2017.02.28
			failed: function() { // 2017.02.28
				var data = {
					local: {
						signal: -199,
						noise: -198,
						br: -1,
						chbw: -1,
						mode: '(unknown)',
						ssid: '(unknown)',
						encrypt: '(unknown)'
					}
				};
				return data;
			},
			// 'demo' mode
			DEMO: function(idx) { // 2017.02.28
				var data = {
					abb: {
						bssid: '01:35:11:05:35:56',
						signal: -107 + 15 + $.cache.RANDOM.int(10),
						noise: -107 + $.cache.RANDOM.int(10),
						br: $.cache.RANDOM.int(26),
						chbw: 8,
						mode: 'CAR',
						ssid: 'gws2017',
						encrypt: ''
					},
					nw: {
						bridge: 1,
						wmac: '13:51:10:53:55:6'+idx,					
						wan_ip: '',
						wan_txb: $.cache.RANDOM.int(26*1024*1024),
						wan_rxb: $.cache.RANDOM.int(26*1024*1024),
						lan_ip: '192.168.1.21'+idx,
						lan_txb: $.cache.RANDOM.int(26*1024*1024),
						lan_rxb: $.cache.RANDOM.int(26*1024*1024)
					},
					gws: {
						rgn: 1,
						ch: 43,
						freq: 650,
						agc: 0,
						rxg: -10 + $.cache.RANDOM.int(30),
						txpwr: $.cache.RANDOM.int(33),
						tpc: $.cache.RANDOM.int(1),
						chbw: 8
					},
					sys: {
						qos: 0,
						firewall: 0,
						atf: 0,
						tdma: 0
					}
				};
				return data;
			}
		},
		// start ajax/proxy query
		sync: { // 2017.02.28
			local: function() { // 2017.02.28
				// TODO: call & handle ajax fails 
				$.get('/cgi-bin/get', { k: 'sync' }, function(resp) {
					//console.log('get?k=sync', resp);
					store.query = {
						local: resp
					};
				}, 'json')
				.fail(function() {
					console.log('get?k=sync', "error> local sync failed");
					store.query = $.cache.query.failed();
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
			DEMO: function() { // 2017.02.28
				var demo = {
					local: $.cache.query.DEMO(0),
					peers: [ $.cache.query.DEMO(1), $.cache.query.DEMO(2) ]
				};
				store.query = demo;
			}
		},


		// parse store.query.cache,
		// save store.history;
		parse: { // 2017.02.28
			// TODO: parse data with DEMO
			local: { // 2017.02.28
				status: function() { // 2017.02.28
					console.log("$.cache.parse.local()", store.query);
					var query = (store && "query" in store) ? store.query_last : null;
					var local = (query && "local" in query) ? query.local : null;

					var abb = (local && "abb" in local) ? local.abb : null;
					var nw = (local && "nw" in local) ? local.nw : null;
					var gws = (local && "gws" in local) ? local.gws : null;
					var sys = (local && "sys" in local) ? local.sys : null;

					var abb_text = '';
					if (abb) {
						if (abb.bssid)		abb_text += abb.bssid;
						if (abb.ssid)		abb_text += ' | '+abb.ssid;
						if (abb.chbw)		abb_text += ' | '+abb.chbw+'M';
						if (abb.mode)		abb_text += ' | '+abb.mode;
					}
					if (gws) {
						var text = 'R'+gws.rgn+' - CH'+gws.ch;
						$('#qz-local-rgn-ch').text(text);
						text = gws.freq+' M - '+gws.chbw+' M';
						$('#qz-local-freq-chbw').text(text);
						text = gws.txpwr+' dBm - TPC '+(gws.tpc ? 'ON' : 'OFF');
						$('#qz-local-txpwr-tpc').text(text);
						text = gws.rxg+' dB - AGC '+(gws.agc ? 'ON' : 'OFF');
						$('#qz-local-rxg-rxagc').text(text);
					}
					if (nw) {
						var text = '';
						if (nw.lan_ip)		text += nw.lan_ip;
						if (nw.wan_ip) 		text += ' / '+nw.wan_ip;
						$('#qz-local-nw').text(text);

						text = abb_text;
						if (nw.bridge) {
							text += ' (router)';
						} else {
							text += ' (bridged)';	
						}

						if (sys) {						
							if (sys.qos)		text += ' | QoS';
							if (sys.firewall)	text += ' | Firweall'
							if (sys.tdma)		text += ' | TDMA';
							if (sys.atf)		text += ' | ATF';
						}
						$('#qz-local-sts').text(text);
					}
				},
				chart: function() { // 2017.02.28
					// set store.history = history;
					var _local_history;

					// check history, query first
					var query = (store && "query" in store) ? store.query : null;
					var query_last = (store && "query_last" in store) ? 
							store.query_last : null;

					var local = (query && "local" in query) ? query.local : null;
					var local_last = (query_last && "local" in query_last) ? 
							query_last.local : null;

					var history = (store && "history" in store) ? store.history : null;
					var local_history = (history && "local" in history) ? 
							history.local : null;


					// start calculation
					if (local) {
						// save txmcs, rxmcs
						var _snr = [], _br = [];
						// calc & save snr, bitrate
						var _ul_thrpt = [], _dl_thrpt = [];

						// calc & save snr
						if ("abb" in local) {						
							var _ = 0;
							if ("signal" in local.abb && "noise" in local.abb) {
								_ = local.abb.signal - local.abb.noise;
							} else {
								_ = 0;
							}

							// push
							if ("snr" in local_history) {
								_snr = $.flot.one(local_history.snr, _, 60);
							} else {
								_snr.push(_);
							}

							// save txmcs
							_ = 0;
							if ("br" in local.abb) {
								_ = local.abb.br;
							}
							if ("br" in local_history) {
								_br = $.flot.one(local_history.br, _, 60);
							} else {
								_br.push(_);
							}
						}

						// save uplink
						if ("nw" in local) {						
							var ul_thprt = 0, dl_thrpt = 0, last_lan_txb = 0, last_lan_rxb = 0;
							if (("lan_txb" in local.nw) && local_last && ("nw" in local_last)) {
								if ("lan_txb" in local_last.nw) {
									ul_thprt = local.nw.lan_txb - local_last.nw.lan_txb;
									ul_thprt = Math.round(ul_thprt / (1024*1024));
									if (ul_thprt < 0)	ul_thprt = 0;
								}

								// save downlink
								if ("lan_rxb" in local_last.nw) {
									dl_thrpt = local.nw.lan_txb - local_last.nw.lan_rxb;
									dl_thrpt = Math.round(dl_thrpt / (1024*1024));
									if (dl_thrpt < 0)	dl_thrpt = 0;
								}
							}

							if ("ul_thrpt" in local_history) {
								_ul_thrpt = $.flot.one(local_history.ul_thrpt, ul_thprt, 60);
							} else {
								_ul_thrpt.push(ul_thprt);
							}
							if ("dl_thrpt" in local_history) {
								_dl_thrpt = $.flot.one(local_history.dl_thrpt, dl_thrpt, 60);
							} else {
								_dl_thrpt.push(dl_thrpt);
							}
						}


						// save to store.history
						_local_history = {
							snr: _snr,
							br: _br,
							ul_thrpt: _ul_thrpt,
							dl_thrpt: _dl_thrpt,
						};

					} else {
						_local_history = {
							snr: null,
							br: null,
							ul_thprt: null,
							dl_thrpt: null
						}
					}

					// save result to "store.history.local"
					store.history.local = _local_history;
					$.cache.save.local();
				}
			},
			// TODO: peers here
			peers: {
				chart: function() {
					//var peers = store.query.peers;
				},
				status: function() {

				}
			}
		},

		save: { // 2017.02.28
			local: function() { // 2017.02.28
				var _ = store.query;
				store.query_last = _;
				store.query = null;
			}
		},

		// "realtime" update
		// TODO: parse & save "store.cache" into "store.history"
		update: function() { // 2017.02.28
			// main data sync sequences
			$.cache.sync.local();
			$.cache.parse.local.status();
			$.cache.parse.local.chart();

			//$.cache.sync.peers();
			//$.cache.parse.peers();
		},
		// 'demo' mode entry
		// TODO: parse & save "store.cache" into "store.history"
		DEMO: function() { // 2017.02.28
			$.cache.sync.DEMO();
			$.cache.parse.local.status();
			$.cache.parse.local.chart();
			//$.cache.parse.peers.status();
			//$.cache.parse.peers.chart();
		},
	}
}) (jQuery); // $.cache


// ui controller
// @2017.02.22
(function($) {
	$.ui = {
		init: function(mode) { // 2017.02.28
			$.materialize.init();
			$.flot.init();
			$.ui.forms();
			if (mode != 'realtime' && mode != 'proxy') {
				var text = '<div class="container section center">(DEMO mode, please <a href="/grid/index.html">LOGIN</a> first)</div>'
				$('#tab2,#tab3,#tab4,#tab5').html(text);
			}
		},
		update: function() { // 2017.02.28
			$.flot.sync();
		},
		forms: function() { // 2017.02.28
			$('form').submit(function() { // 2017.02.28
				return false;
			});
		},
		obj: {
			enable: function(obj) {
				obj.attr('disabled', false);
			},
			disable: function(obj) {
				obj.attr('disable', true);
			}
		}
	}
}) (jQuery); // $.ui


// Bind & handle all "EVENT"
// TODO: this page not finished yet
(function($) { // 2017.02.28
	$.ops = { // 2017.02.28
		init: function(mode) { // 2017.02.28
			if (mode == 'demo') {
				$('#tab2,#tab3,#tab4,#tab5').click(function() { // 2017.02.28
					var obj = $(this);
					console.log('> toast() when click', obj);
					$.materialize.toast('Not available in "DEMO" mode');
				});
			} else {
				$('#qz-btn-sys-reset').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('Reset Network');
					$('#qz-modal-chcfm-affected').text('This Operation Will REBOOT This Device');
					$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'sys');
				});

				$('#qz-btn-abb-reset').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('Reset Analog Baseband');
					$('#qz-modal-chcfm-affected').text('This Operation Will Interrupt Your Current Wireless Communication');
					$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'abb');
				});

				$('#qz-btn-gws-reset').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('Reset GWS');
					$('#qz-modal-chcfm-affected').text('This Operation Will Interrupt Your Current Wireless Communication');
					$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'gws');
				});

				$('#qz-btn-nw-reset').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('Reset Network');
					$('#qz-modal-chcfm-affected').text('This Operation Will Interrupt Your Current Network Communication, including Wireless Communication');
					$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'nw');
				});

				$('#qz-btn-fw-factory').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('Reset to FACTORY SETTINGS');
					$('#qz-modal-chcfm-affected').text('This Operation Will RESET This Device to FACTORY SETTINGS !');
					$('#qz-btn-confirm-change').attr('ops', 'init').attr('val', 'new');
				})

				$('#qz-btn-confirm-change').click(function() { // 2017.02.28
					var ops = $(this).attr('ops');
					var val = $(this).attr('val');
					console.log('ops>', ops, val);

					var url = '/cgi-bin/' + ops;
					if (val) {
						url += ('?k=' + val);
					}

					$.ops.ajax(val, url, null);
				});

				$(':text').keydown(function(e) { // 2017.02.28
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
				$(':checkbox').click(function() { // 2017.02.28
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
				$('select').change(function() { // 2017.02.28
					var obj = $(this);
					obj.qz = {
						_com: obj.attr('alt'),
						_item: obj.attr('name'),
						_val: obj.val()
					};
					$.ops.change(obj);
				})
			}

			$('.qz-btn-local-chart-fields').click(function() { // 2017.02.28
				var type = $(this).attr('alt');
				store.flot.fields = type;
			});

 		},
		change: function(obj) { // 2017.02.28
			if (obj.qz._val != '' && obj.qz._val != '-') {
				console.log('enter >', obj.qz._com, obj.qz._item, obj.qz._val);

				$.ops.ajax('Save', '/cgi-bin/set', {
					com: obj.qz._com, item: obj.qz._item, val: obj.qz._val
				}, obj);
			}
		},
		ajax: function(ops, url, params, obj) { // 2017.02.28
			var prompt = '';

			// prevent multi-submit
			if (obj) {
				$.ui.obj.disabled(obj);
				console.log(' disable:', obj.attr('disabled'));
			}

			$.get(url, params, function(resp) { // 2017.02.28
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
				console.log('ajax (ok) result:', prompt);

				$.materialize.toast(prompt);

				// reset nw: reload
				// reset sys: close
				$.ops.ajax_done(ops);

				// release submit
				if (obj) $.ui.obj.enable(obj);
			})
			.fail(function(resp) { // 2017.02.28
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
				console.log('ajax (fail) result:', prompt);
				
				$.materialize.toast(prompt);

				// reset nw: reload
				// reset sys: close
				$.ops.ajax_done(ops);

				// release submit
				if (obj) $.ui.obj.enable(obj);
				console.log(' disable:', obj.attr('disabled'));
			});
		},
		ajax_done: function(ops) { // 2017.02.28
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
(function($) {
	$.app = {
		init: function(mode) { // 2017.02.28
			store.mode = mode;
			$.ui.init(mode);
			$.cache.init();
			$.ops.init(mode);
		},
		// update store.query.cache with "ajax"
		update: function() { // 2017.02.28
			$.cache.update();
			$.ui.update();
		},
		// update store.query.cache with "DEMO"
		DEMO: function() { // 2017.02.28
			$.cache.DEMO();
			$.ui.update();
		},
		run: function(mode) { // 2017.02.28
			// init cache/data, ui
			$.app.init(mode);
			switch(mode) {
			case 'realtime':
				console.log("App Running (realtime).");
				// main loop
				$.app.update();
				store.flot.intl.local = setInterval("$.app.update()", 1000);
				break;
			case 'demo':
			default:
				console.log("App Running in DEMO mode.");
				$.app.DEMO();
				store.flot.intl.DEMO = setInterval("$.app.DEMO()", 1000);
				break;
			}
		}
	}
}) (jQuery); // $.app


// app starts here
$(function() { // 2017.02.28
	var m = $.url.get('k') || 'demo';
	$.app.run(m);
});


// by 6Harmonics Qige @ 2017.02.22

// data controller
(function($) {
	$.cache = {
		// ...
		init: function() {
		},
		fmt: {
			float: function(num) {
				return Math.floor(num * 10) / 10;
			}
		},
		calc: {
			thrpt: function(bytes, bytes_last) {
				var thrpt = 0;
				if (bytes > bytes_last) {
					var ts_gap = 1; // TODO: calc ts gap
					var bits = (bytes - bytes_last);
					var mbits = bits * 8 / 1024 / 1024;
					thrpt = mbits / ts_gap;
				}
				thrpt = $.cache.fmt.float(thrpt);
				return thrpt;
			}
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
		save: { // 2017.02.28
			local: function() { // 2017.02.28
				var _ = store.query;
				store.query_last = _;
				store.query = null;
			}
		},
		// clear chart data when click "CLEAR" button
		clear: {
			local: function() {
				store.history.local.length = 0;
			}
		},
		// ajax query
		query: { // 2017.02.28
			failed: {
				instant: function() { // 2017.02.28
					var data = {
						local: {
							signal: -199,
							noise: -198,
							br: -1,
							chbw: -1,
							mode: '(unknown)',
							ssid: '(unknown)',
							encrypt: '(unknown)'
						},
						nw: {
							eth_txb: 0,
							eth_rxb: 0,
							wls_txb: 0,
							wls_rxb: 0
						}
					};
					return data;
				},
				delayed: function() { // return structured object, don't update
					var data = { gws: null, sys: null };
					return data;
				}
			},
			// 'demo' mode
			DEMO: function(idx) { // 2017.02.28
				var data = {
					abb: {
						bssid: '01:35:11:05:35:56',
						signal: -107 + 40 + $.cache.RANDOM.int(5),
						noise: -107 + $.cache.RANDOM.int(2),
						br: 22 + $.cache.RANDOM.int(2),
						chbw: 8,
						mode: 'CAR',
						ssid: 'gws2017',
						encrypt: ''
					},
					nw: {
						bridge: 1,
						wmac: '13:51:10:53:55:6'+idx,					
						wan_ip: '',
						lan_ip: '192.168.1.21'+idx,
						eth_txb: $.cache.RANDOM.int(2*1024*1024),
						eth_rxb: $.cache.RANDOM.int(2*1024*1024),
						wls_txb: $.cache.RANDOM.int(1*1024*1024),
						wls_rxb: $.cache.RANDOM.int(1*1024*1024)
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
			local: {
				instant: function() { // 2017.02.28
					$.get('/cgi-bin/get', { k: 'instant' }, function(resp) {
						//console.log('get?k=instant', resp);
						store.query = {
							local: resp
						};
					}, 'json')
					.fail(function() {
						console.log('get?k=instant', "error> local (instant) failed");
						store.query = $.cache.query.failed.instant();
					});
				},
				delayed: function() {
					$.get('/cgi-bin/get', { k: 'delayed' }, function(resp) {
						//console.log('get?k=delayed', resp);
						store.delayed = resp;
					}, 'json')
					.fail(function() {
						console.log('get?k=delayed', "error> local (delayed) failed");
						store.delayed = $.cache.query.failed.delayed();
					});
				}
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
				// parse data from store.query, store.query_last
				// prepare & save to history, then $.ui.update() can redraw()
				chart: function() { // 2017.03.01
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
						var _eth_thrpt = [], _wls_thrpt = [];

						// calc & save snr
						if ("abb" in local) {						
							var snr = 0, signal = -199, noise = -198;
							if ("signal" in local.abb && "noise" in local.abb) {
								signal = local.abb.signal || -110;
								noise = local.abb.noise || -105; // fix gws4k noise=unknown
								snr = signal - noise;
							} else {
								snr = 0;
							}

							if (snr < 0) snr = 0;

							// push
							if ("snr" in local_history) {
								_snr = $.flot.one(local_history.snr, snr, 60);
							} else {
								_snr.push(snr);
							}

							// save txmcs
							var br = 0;
							if ("br" in local.abb) {
								br = local.abb.br;
							}
							if ("br" in local_history) {
								_br = $.flot.one(local_history.br, br, 60);
							} else {
								_br.push(br);
							}

							console.log('realtime> Signal/noise/SNR/Bitrate:', 
								signal, noise, snr, br);
						}

						// save uplink
						if ("nw" in local) {
							var eth_thrpt = 0, wls_thrpt = 0;
							if (("eth_txb" in local.nw) && local_last && ("nw" in local_last)) {
								if ("eth_txb" in local_last.nw) {
									//console.log('dbg> 0. local/last eth_txb:', local.nw.eth_txb, local_last.nw.eth_txb);
									eth_thrpt = $.cache.calc.thrpt(local.nw.eth_txb, local_last.nw.eth_txb);
								}
								//console.log('dbg> 1. eth Thrpt:', eth_thrpt);
								// save downlink
								if ("eth_rxb" in local_last.nw) {
									eth_thrpt += $.cache.calc.thrpt(local.nw.eth_rxb, local_last.nw.eth_rxb);
								}
								//console.log('dbg> 2. eth Thrpt:', eth_thrpt);
							}
							if (("wls_txb" in local.nw) && local_last && ("nw" in local_last)) {
								if ("wls_txb" in local_last.nw) {
									wls_thrpt = $.cache.calc.thrpt(local.nw.wls_txb, local_last.nw.wls_txb);
								}
								// save downlink
								if ("wls_rxb" in local_last.nw) {
									wls_thrpt += $.cache.calc.thrpt(local.nw.wls_rxb, local_last.nw.wls_rxb);
								}
							}

							eth_thrpt = $.cache.fmt.float(eth_thrpt); 
							wls_thrpt = $.cache.fmt.float(wls_thrpt); 
							console.log('realtime> eth/wls Thrpt:', eth_thrpt, wls_thrpt);
							if ("eth_thrpt" in local_history) {
								_eth_thrpt = $.flot.one(local_history.eth_thrpt, eth_thrpt, 60);
							} else {
								_eth_thrpt.push(eth_thrpt);
							}
							if ("wls_thrpt" in local_history) {
								_wls_thrpt = $.flot.one(local_history.wls_thrpt, wls_thrpt, 60);
							} else {
								_wls_thrpt.push(wls_thrpt);
							}
						}


						// save to store.history
						_local_history = {
							snr: _snr,
							br: _br,
							eth_thrpt: _eth_thrpt,
							wls_thrpt: _wls_thrpt,
						};

					} else {
						_local_history = {
							snr: null,
							br: null,
							eth_thprt: null,
							wls_thrpt: null
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


		// "realtime" update
		// TODO: parse & save "store.cache" into "store.history"
		update: {
			instant: function() { // 2017.02.28
				// main data sync sequences
				$.cache.sync.local.instant();
				$.cache.parse.local.chart();

				//$.cache.sync.peers();
				//$.cache.parse.peers();
			},
			delayed: function() {
				$.cache.sync.local.delayed();
			}
		},
		// 'demo' mode entry
		// TODO: parse & save "store.cache" into "store.history"
		DEMO: function() { // 2017.02.28
			$.cache.sync.DEMO();
			$.cache.parse.local.instant();
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
				$.ui.obj.DEMO();
			}
		},
		update: {
			instant: function() { // 2017.03.03
				//console.log("$.cache.parse.local()", store.query);
				var query = (store && "query" in store) ? store.query_last : null;
				var local = (query && "local" in query) ? query.local : null;

				var abb = (local && "abb" in local) ? local.abb : null;
				var nw = (local && "nw" in local) ? local.nw : null;
				var sys = (local && "sys" in local) ? local.sys : null;

				var abb_text = '';
				if (abb) {
					if (abb.bssid)		abb_text += abb.bssid;
					if (abb.ssid)		abb_text += ' | '+abb.ssid;
					if (abb.chbw)		abb_text += ' | '+abb.chbw+'M';
					if (abb.mode)		abb_text += ' | '+abb.mode;
				}
				if (nw) {
					var text = '';
					if (nw.lan_ip && nw.lan_ip != '-') text += nw.lan_ip;
					if (nw.wan_ip && nw.wan_ip != '-') text += ' / '+nw.wan_ip;
					$('#qz-local-nw').text(text);

					text = abb_text;
					if (nw.bridge) {
						text += ' (bridge)';
					} else {
						text += ' (router)';	
					}

					if (sys) {						
						if (sys.qos > 0)		text += ' | QoS';
						if (sys.firewall > 0)	text += ' | Firweall'
						if (sys.tdma > 0)		text += ' | TDMA';
						if (sys.atf > 0)		text += ' | ATF';
					}
					$('#qz-local-sts').text(text);
				}

				// update chart
				$.flot.sync();
			},
			delayed: function() {
				//console.log('dbg> $.ui.update.delayed()');
				var delayed = store.delayed;
				//console.dir(delayed);
				var gws = (delayed && "gws" in delayed) ? delayed.gws : null;
				var sys = (delayed && "sys" in delayed) ? delayed.sys : null;

				if (gws) {
					var text;
					var rgn = -1, ch = -1, txpwr = -99, tpc = -1, rxgain = -1, agc = -1;
					var freq = -1, bw = -1;

					rgn = ("rgn" in gws) ? gws.rgn : -1;
					ch = ("ch" in gws) ? gws.ch : -1;

					text = 'R'+rgn+' - CH'+ch;
					$('#qz-local-gws1').text(text);

					freq = (rgn > 0) ? 474+(ch-21)*8 : 473+(ch-14)*6;
					bw = ("bw" in gws) ? gws.bw : -1;
					if (bw > 0) {
						text = freq+'MHz - '+bw+'M';
					} else {
						text = freq+'MHz - (unknown)';
					}
					$('#qz-local-gws2').text(text);

					txpwr = ("txpwr" in gws) ? gws.txpwr : -99;
					tpc = ("tpc" in gws) ? gws.tpc : -1;
					if (txpwr >= -15) {
						text = txpwr+' dBm';
					} else {
						text = 'Tx OFF';
					}
					text += ' - ';
					if (tpc > 0) {
						text += 'TPC ON';
					} else if (tpc == 0) {
						text += 'TPC OFF';
					} else {
						text += 'No TPC';
					}
					$('#qz-local-gws3').text(text);


					rxgain = ("rxg" in gws) ? gws.rxg : -99;
					agc = ("agc" in gws) ? gws.agc : -1;
					if (rxgain > -99) {
						text = rxgain+' dB';
					} else {
						text = '0';
					}
					text += ' - ';
					if (agc > 0) {
						text += 'AGC ON';
					} else if (agc == 0) {
						text += 'AGC OFF';
					} else {
						text += 'No AGC';
					}
					$('#qz-local-gws4').text(text);

					text = ("note" in gws) ? gws.note : '...';
					$('#qz-local-gws5').text(text);
					
					console.log("delayed> region/channel/txpwr/tpc/rxgain/agc", 
						rgn, ch, txpwr, tpc, rxgain, agc);
				}
			}
		},
		forms: function() { // 2017.02.28
			$('form').submit(function() { // 2017.02.28
				// prevent all "form" submit
				return false;
			});
		},
		obj: {
			enable: function(obj) {
				if (typeof(obj) == 'object')
					obj.removeAttr('disabled');
			},
			disable: function(obj) {
				if (typeof(obj) == 'object')
					obj.attr('disabled', 'disabled');
			},
			// clean "div" contents when DEMO
			DEMO: function() {
				var text = '<div class="container section center">(DEMO mode, please <a href="/grid/index.html">LOGIN</a> first)</div>'
				$('#tab2,#tab3,#tab4,#tab5').html(text);
			}
		}
	}
}) (jQuery); // $.ui


// Bind & handle all "EVENT"
// TODO: this page not finished yet
(function($) { // 2017.02.28
	$.ops = { // 2017.02.28
		init: function(mode) { // 2017.02.28
			// empty some "div" in "DEMO" mode
			if (mode == 'demo') {
				$('#tab2,#tab3,#tab4,#tab5').click(function() { // 2017.02.28
					var obj = $(this);
					console.log('> toast() when click', obj);
					$.materialize.toast('Not available in "DEMO" mode');
				});
			} else {
				// bind these buttons click() 
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
				});

				$('#qz-btn-flood-start').click(function() {
					var obj = $(this);
					$.ops.tool.flood(obj);
				});

				$('#qz-btn-ping-start').click(function() {
					var obj = $(this);
					$.ops.tool.ping(obj);
				});
			}

			$('.qz-btn-local-chart-fields').click(function() { // 2017.02.28
				var type = $(this).attr('alt');
				store.flot.fields = type;
			});

 		},
 		tool: {
 			flood: function(obj) { // 2017.03.02
				var target = $('#qz-tool-flood-target').val();
				var times = $('#qz-tool-flood-times').val();
				var bw = $('#qz-tool-flood-bw').val();
				var as = $('#qz-tool-flood-as').attr('checked');

				console.log('tool > flooding now: to/times/bw/as =', target, times, bw, as);
				$.ops.ajax('flood', '/cgi-bin/tool', {
					k: 'flood', to: target, times: times, bw: bw
				}, obj);
			},
			ping: function(obj) { // 2017.03.02
				var target = $('#qz-tool-ping-target').val();
				var times = 4;
				//var times = $('#qz-tool-ping-times').val();

				console.log('tool > ping now ...', target, times);
				$.ops.ajax('ping', '/cgi-bin/tool', {
					k: 'ping', to: target, times: times
				}, obj);
			}
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
			// disable the button or input that been changed
			if (obj) {
				$.ui.obj.disable(obj);
			}

			$.get(url, params, function(resp) { // 2017.02.28
				console.dir('dbg> $.get with resp', resp);
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
				case 'flood':
					prompt = 'Flooding target done';
					break;
				case 'ping':
					// TODO: set result to "textarea"
					prompt = 'PING target done';
					$('#qz-tool-ping-result').val(resp);
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

				// release button or input
				if (obj) $.ui.obj.enable(obj);
			})
			.fail(function(resp) { // 2017.02.28
				console.dir('dbg> $.get failed with resp', resp);
				switch(ops) {
				case 'nw':
					prompt = 'Network has been RESET';
					break;
				case 'sys':
					prompt = 'Device is REBOOTING';
					break;
				case 'flood':
					prompt = 'Flooding target FAILED';
					break;
				case 'ping':
					// TODO: set result to "textarea"
					prompt = 'PING target FAILED';
					$('#qz-tool-ping-result').val(resp);
					break;
				default:
					prompt = 'Operation FAILED > ' + ops;
					break;
				}
				console.log('ajax (fail) result:', prompt);
				
				$.materialize.toast(prompt);

				// reset nw: reload
				// reset sys: close
				$.ops.ajax_done(ops);

				// release submit
				if (obj) $.ui.obj.enable(obj);
			});
		},
		// call when need to operate URL, or reload()
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
		},
		// some job that may need after $.get() operated
		// eg. "Tools!" > "Ping"
		ajax_set: function(text) {
			if (typeof(obj) == 'object') {
				console.log('dbg>', text);
				obj.val(text);
			}
		}
	}
}) (jQuery); // $.ops


// app algorithm
(function($) {
	$.app = {
		init: function(mode) { // 2017.02.28
			store.mode = mode;
			$.cache.init();
			$.ui.init(mode);
			$.ops.init(mode);
		},
		// update store.query.cache with "ajax"
		// there 2 types of ajax query
		// 1. these return immediately, 
		// like query abb via "libiwinfo-lua", "cat /proc/net/dev"
		// so use "$.app.update.instant()";
		// 2. those will take few seconds, like "rfinfo"
		// so use "$.app.update.delayed()".
		update: {
			instant: function() { // 2017.02.28
				$.cache.update.instant();
				$.ui.update.instant();
			},
			delayed: function() { // 2017.03.04
				$.cache.update.delayed();
				$.ui.update.delayed();
			}
		},
		// update store.query.cache with "DEMO"
		// DEMO mode data will be generated locally by Browser itself
		// so don't need to update them seperately
		// but it shares the same UI update methods.
		DEMO: function() { // 2017.02.28
			$.cache.DEMO();
			$.ui.update.instant();
			$.ui.update.delayed();
		},
		run: function(mode) { // 2017.02.28
			// init cache/data, ui
			$.app.init(mode);
			switch(mode) {
			case 'realtime':
				console.log("App Running (realtime).");
				// main loop
				$.app.update.instant();
				store.flot.intl.local.instant = setInterval("$.app.update.instant()", 1000);

				$.app.update.delayed();
				store.flot.intl.local.delayed = setInterval("$.app.update.delayed()", 4000);
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


// by 6Harmonics Qige @ 2017.02.22

// data controller
(function($) {
	$.cache = {
		// ...
		init: function() {
			// ajax "instant" should return in 200ms
			// ajax "delayed" shoudl return in 4000ms
			// /$.ajaxSetup({ timeout: 500 });

			// invalid noise/signal value
			$.cache._invalid = -999;
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
			instant: function() { // 2017.02.28
				var _ = store.query;
				store.query_last = _;
				store.query = null;
			}
		},
		// ajax query
		query: { // 2017.02.28
			failed: {
				instant: function() { // 2017.02.28
					var data = { local: null, nw: null };
					return data;
				},
				delayed: function() {
					var data = {
						gws: {
							rgn: 1,
							ch: 43,
							freq: 650,
							agc: 0,
							rxg: -10 + $.cache.RANDOM.int(30),
							txpwr: 21,
							tpc: $.cache.RANDOM.int(1),
							chbw: 8
						},
						sys: {
							qos: 1,
							firewall: 0,
							atf: -1,
							tdma: 1
						}
					};
					return data;
				}
			},
			// 'demo' mode
			DEMO: {
				instant: function(idx) { // 2017.02.28
					var x = $.cache.RANDOM.int(100);
					var peers;
					if (x > -1) {
						peers = [{
							mac: '01:53:01:09:19:15',
							ip: '192.168.1.211',
							signal: -75 + $.cache.RANDOM.int(10),
							noise: -101 + $.cache.RANDOM.int(2),
							tx_mcs: 4,
							tx_br: 22 + $.cache.RANDOM.int(2),
							rx_mcs: 4,
							rx_br: 18 + $.cache.RANDOM.int(2),
							tx_short_gi: -1,
							rx_short_gi: -1,
							inactive: $.cache.RANDOM.int(2048)
						}/*,{
							mac: '01:53:01:09:19:16',
							ip: '192.168.1.212',
							signal: -70 + $.cache.RANDOM.int(10),
							noise: -101 + $.cache.RANDOM.int(2),
							txmcs: 2,
							txbr: 12.6,
							rxmcs: 1,
							rxbr: 6.8,
							shortgi: 0,
							inactive: $.cache.RANDOM.int(2048)
						}*/];
					} else {
						peers = null;
					}
					var data = {
						abb: {
							bssid: '01:35:11:05:35:56',
							noise: -99 + $.cache.RANDOM.int(2),
							chbw: 8,
							mode: 'CAR',
							ssid: 'gws2017',
							encrypt: '',
							peers: peers
						},
						nw: {
							bridge: 1,
							wmac: '13:51:10:53:55:6'+idx,					
							wan_ip: '',
							lan_ip: '192.168.1.21'+idx,
							eth_txb: $.cache.RANDOM.int(4*1024*1024),
							eth_rxb: $.cache.RANDOM.int(2*1024*1024),
							wls_txb: $.cache.RANDOM.int(1*1024*1024),
							wls_rxb: $.cache.RANDOM.int(3*1024*1024)
						}
					};
					return data;
				},
				delayed: function() {
					var data = {
						gws: {
							rgn: 1,
							ch: 43,
							freq: 650,
							agc: 0,
							rxg: -10 + $.cache.RANDOM.int(30),
							txpwr: 21,
							tpc: $.cache.RANDOM.int(1),
							chbw: 8
						},
						sys: {
							qos: 1,
							firewall: 0,
							atf: -1,
							tdma: 1
						}
					};
					return data;
				}
			}
		},
		// start ajax/proxy query
		sync: { // 2017.02.28
			local: {
				instant: function() { // 2017.02.28
					$.ajax({
						url: '/cgi-bin/get', 
						data: { k: 'instant' }, 
						success: function(resp) {
							//console.log('get?k=instant', resp);
							store.query = {
								local: resp
							};
						},
						error: function(xhr, status, error) {
if (store.debug)
							console.log('get?k=instant', "error> local (instant) failed", error);
							store.query = $.cache.query.failed.instant();
						},
						timeout: 666,
						dataType: 'json'
					});
				},
				delayed: function() {
					$.ajax({
						url: '/cgi-bin/get', 
						data: { k: 'delayed' }, 
						success: function(resp) {
							//console.log('get?k=delayed', resp);
							store.delayed = resp;
						}, 
						error: function(xhr, status, error) {
if (store.debug)
							console.log('get?k=delayed', "error> local (delayed) failed", error);
							store.delayed = $.cache.query.failed.delayed();
						},
						dataType: 'json',
						timeout: 4000
					});
				}
			},
			// unused, proxy query
			proxy: function() {
				// TODO: call & handle ajax fails
				$.ajax({
					url: '/cgi-bin/proxy', 
					data: { mac: '', ip: '' }, 
					success: function(resp) {
					},
					error: function() {
if (store.debug)
						console.log("error> peers sync failed");
					},
					dataType: 'json',
					timeout: 4000
				});
			},
			// generate DEMO data
			DEMO: function() { // 2017.02.28
				var demo = {
					local: $.cache.query.DEMO.instant(0),
					peers: [ $.cache.query.DEMO.instant(1), $.cache.query.DEMO.instant(2) ]
				};
				store.query = demo;
				//console.log('DEMO', demo);

				var delayed = $.cache.query.DEMO.delayed(0);
				store.delayed = delayed;
			}
		},


		// parse store.query.cache,
		// save store.history;
		parse: { // 2017.02.28
			instant: {
				// TODO: parse data with DEMO
				local: function() { // 2017.02.28
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
					// if local=null, 1st time calculation;
					// if not, start caculatte thrpt of eth/wls
					if (local) {
						var _noise = [];
						var _eth_tx_thrpt = [], _eth_rx_thrpt = [];
						var _wls_tx_thrpt = [], _wls_rx_thrpt = [];

						// calc & save snr
						if ("abb" in local) {						
							var noise = $.cache._invalid;
							if ("noise" in local.abb) {
								noise = local.abb.noise || $.cache._invalid; // fix gws4k noise=unknown
							}

							// push
							if ("noise" in local_history) {
								_noise = $.flot.one(local_history.noise, noise, 60);
							} else {
								_noise.push(noise);
							}
							//console.log('realtime> Noise:',noise);
						}

						// save uplink
						//console.log('dbg> local.nw', local.nw);
						var eth_tx_thrpt = 0, eth_rx_thrpt = 0, wls_tx_thrpt = 0, wls_rx_thrpt = 0;
						if ("nw" in local && local_last && "nw" in local_last) {
							var nw = local.nw;
							var nw_last = local_last.nw;
							//console.log('dbg> local_last.nw', nw_last);
							if (("eth_txb" in nw) && local_last && ("nw" in local_last)) {
								if ("eth_txb" in local_last.nw) {
									//console.log('dbg> 0. local/last eth_txb:', local.nw.eth_txb, local_last.nw.eth_txb);
									eth_tx_thrpt = $.cache.calc.thrpt(local.nw.eth_txb, local_last.nw.eth_txb);
								}
								//console.log('dbg> 1. eth Thrpt:', eth_thrpt);
								// save downlink
								if ("eth_rxb" in local_last.nw) {
									eth_rx_thrpt += $.cache.calc.thrpt(local.nw.eth_rxb, local_last.nw.eth_rxb);
								}
								//console.log('dbg> 2. eth Thrpt:', eth_thrpt);
							}
							if (("wls_txb" in local.nw) && local_last && ("nw" in local_last)) {
								if ("wls_txb" in local_last.nw) {
									wls_tx_thrpt = $.cache.calc.thrpt(local.nw.wls_txb, local_last.nw.wls_txb);
								}
								// save downlink
								if ("wls_rxb" in local_last.nw) {
									wls_rx_thrpt += $.cache.calc.thrpt(local.nw.wls_rxb, local_last.nw.wls_rxb);
								}
							}

							eth_tx_thrpt = $.cache.fmt.float(eth_tx_thrpt); 
							eth_rx_thrpt = $.cache.fmt.float(eth_rx_thrpt); 
							wls_tx_thrpt = $.cache.fmt.float(wls_tx_thrpt); 
							wls_rx_thrpt = $.cache.fmt.float(wls_rx_thrpt); 
if (store.debug)
							console.log('实时> eth/wls tx/rx Thrpt:', eth_tx_thrpt, eth_rx_thrpt, wls_tx_thrpt, wls_rx_thrpt);
						}

						if ("eth_tx_thrpt" in local_history) {
							_eth_tx_thrpt = $.flot.one(local_history.eth_tx_thrpt, eth_tx_thrpt, 60);
						} else {
							_eth_tx_thrpt.push(eth_tx_thrpt);
						}
						if ("eth_rx_thrpt" in local_history) {
							_eth_rx_thrpt = $.flot.one(local_history.eth_rx_thrpt, eth_rx_thrpt, 60);
						} else {
							_eth_rx_thrpt.push(eth_rx_thrpt);
						}
						if ("wls_tx_thrpt" in local_history) {
							_wls_tx_thrpt = $.flot.one(local_history.wls_tx_thrpt, wls_tx_thrpt, 60);
						} else {
							_wls_tx_thrpt.push(wls_tx_thrpt);
						}
						if ("wls_rx_thrpt" in local_history) {
							_wls_rx_thrpt = $.flot.one(local_history.wls_rx_thrpt, wls_rx_thrpt, 60);
						} else {
							_wls_rx_thrpt.push(wls_rx_thrpt);
						}
						if ("wls_rx_thrpt" in local_history) {
							_wls_rx_thrpt = $.flot.one(local_history.wls_rx_thrpt, wls_rx_thrpt, 60);
						} else {
							_wls_rx_thrpt.push(wls_rx_thrpt);
						}


						// TODO: should not put null to history right away,
						// we should push a null value instead of whole null value

						// TODO: should not put null to history right away,
						// we should push a null value instead of whole null value

						// save to store.history
						_local_history = {
							noise: _noise,
							eth_tx_thrpt: _eth_tx_thrpt,
							eth_rx_thrpt: _eth_rx_thrpt,
							wls_tx_thrpt: _wls_tx_thrpt,
							wls_rx_thrpt: _wls_rx_thrpt,
						};

					} else {
						// if local=null, it's 1st time calculating
						_local_history = {
							noise: null,
							eth_tx_thprt: null,
							eth_rx_thprt: null,
							wls_tx_thrpt: null,
							wls_rx_thrpt: null
						}
					}

					// save result to "store.history.local"
					store.history.local = _local_history;
				},
				// TODO: peers here
				peers: function() {
					var _peer_history = [];

					var _invalid = $.cache._invalid;

					var query = (store && "query" in store) ? store.query : null;
					var local = (query && "local" in query) ? query.local : null;
					var abb = (local && "abb" in local) ? local.abb : null;
					var peers = (abb && "peers" in abb) ? abb.peers : null;
					//console.log('dbg 0307> $.cache.parse.peers():', query, local, abb, peers);

					if (peers && peers.length > 0) {
						// prepare each peer for flot chart
						$.each(peers, function(idx, obj) {
							//console.log("dbg 0307> $.cache.parse.peers(): peer=", obj);

							// update & set display
							$.ui.update.peer(idx, obj);

							var _peer = {};
							var history = (store && "history" in store) ? store.history : null;
							var peers_history = (history && "peers" in history) ? 
									history.peers : null;
							var peer_history = (peers_history && peers_history.length > idx) ? 
									peers_history[idx] : null;
							//console.log("dbg 0307> this peer_history", history, peers_history, peer_history);


							var _rx_br = [], _rx_mcs = [], _tx_br = [], _tx_mcs = [], _snr = [];

							var rx_br = (obj && "rx_br" in obj) ? obj.rx_br : 0;
							var rx_mcs = (obj && "rx_mcs" in obj) ? obj.rx_mcs : 0;
							var tx_br = (obj && "tx_br" in obj) ? obj.tx_br : 0;
							var tx_mcs = (obj && "tx_mcs" in obj) ? obj.tx_mcs : 0;

							var snr;
							var noise = (obj && "noise" in obj) ? obj.noise : _invalid;
							var signal = (obj && "signal" in obj) ? obj.signal : _invalid;
							if (signal && noise) {
								snr = signal - noise;
							} else {
								snr = 0;
							}
							
							if (snr < 0) {
								snr = 0;
							}
							if (tx_br == rx_br) {
								tx_br -= 0.1;
								rx_br += 0.1;
							}
							if (tx_mcs == rx_mcs) {
								tx_mcs -= 0.05;
								rx_mcs += 0.05;
							}

if (store.debug)
							console.log('实时> peer'+idx+' rxbr/rxmcs/txbr/txmcs/snr=', 
								rx_br, rx_mcs, tx_br, tx_mcs, snr);
							if (peer_history) {
								_rx_br = $.flot.one(peer_history.rx_br, rx_br, 60);
								_rx_mcs = $.flot.one(peer_history.rx_mcs, rx_mcs, 60);
								_tx_br = $.flot.one(peer_history.tx_br, tx_br, 60);
								_tx_mcs = $.flot.one(peer_history.tx_mcs, tx_mcs, 60);
								_snr = $.flot.one(peer_history.snr, snr, 60);
							} else {
								_rx_br.push(rx_br);
								_rx_mcs.push(rx_mcs);
								_tx_br.push(tx_br);
								_tx_mcs.push(tx_mcs);
								_snr.push(snr);
							}

							_peer.rx_br = _rx_br;
							_peer.rx_mcs = _rx_mcs;
							_peer.tx_br = _tx_br;
							_peer.tx_mcs = _tx_mcs;
							_peer.snr = _snr;
							_peer_history[idx] = _peer;
						});
						//if (store.history.peers)
						//console.log('store.history.peers after parse()', store.history.peers);
					} else{
						// should push a null value in each fields
					}

					store.history.peers = _peer_history;
				}
			}
		},


		// "realtime" update
		// TODO: parse & save "store.cache" into "store.history"
		update: {
			instant: function() { // 2017.02.28
				// main data sync sequences
				$.cache.sync.local.instant();
				// parse data into store.history
				$.cache.parse.instant.local();
				$.cache.parse.instant.peers();
				// save current data for next time parse()
				$.cache.save.instant();
			},
			delayed: function() {
				$.cache.sync.local.delayed();
			}
		},
		// 'demo' mode entry
		// TODO: parse & save "store.cache" into "store.history"
		DEMO: function() { // 2017.03.06
			$.cache.sync.DEMO();
			$.cache.parse.instant.local();
			$.cache.parse.instant.peers();

			// save current data for next time parse()
			$.cache.save.instant();
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
		settings: {
			mode: function(_mode) {
				var _val = -1;
				switch(_mode) {
				case 'CAR':
					_val = 2;
					break;
				case 'Mesh':
					_val = 0;
					break;
				case 'EAR':
				default:
					_val = 1;
					break;
				}
				$('#qz-set-abb-mode').val(_val);
				//console.log('dbg> mode in settings:', _val);
			}
		},
		update: {
			peer: function(idx, peer_cache) {
				var _p = $('.qz-peer-chart-n').eq(idx);
				if (_p) {
					var text1 = '', text2 = '';
					var mac = (peer_cache && "mac" in peer_cache) ? peer_cache.mac : '';
					var ip = (peer_cache && "ip" in peer_cache) ? peer_cache.ip : '';

					if (ip) {
						text1 = ip;
						text2 = mac;
					} else {
						text1 = mac;
						text = '';
					}
					_p.find('.qz-peer-name').text(text1);
					_p.find('.qz-peer-desc').text(text2);
					_p.find('.qz-btn-peer-proxy').attr('alt', mac);
				}
			},
			instant: function() { // 2017.03.03
				//console.log("$.ui.update.instant()", store.query);
				var query = (store && "query_last" in store) ? store.query_last : null;
				var local = (query && "local" in query) ? query.local : null;
				var delayed = (store && "delayed" in store) ? store.delayed : null;

				var abb = (local && "abb" in local) ? local.abb : null;
				var nw = (local && "nw" in local) ? local.nw : null;
				var sys = (delayed && "sys" in delayed) ? delayed.sys : null;

				var abb_text = '';
				if (abb) {
					if (abb.bssid)		abb_text += abb.bssid;
					if (abb.ssid)		abb_text += ' | '+abb.ssid;
					if (abb.chbw)		abb_text += ' | '+abb.chbw+'M';
					if (abb.mode)		abb_text += ' | '+abb.mode;

					$.ui.settings.mode(abb.mode);
				}
				if (nw) {
					var text = '';
					if (nw.lan_ip && nw.lan_ip != '-') {
						text += nw.lan_ip;
						$('#qz-set-lan-ip').val(nw.lan_ip);
					}
					if (nw.wan_ip && nw.wan_ip != '-') {
						text += ' / '+nw.wan_ip;
						$('#qz-set-wan-ip').val(nw.lan_ip);
					}
					$('#qz-local-nw').text(text);

					text = abb_text;
					if (nw.bridge) {
						text += ' (桥接)';
					} else {
						text += ' (路由器)';	
					}

					if (sys) {						
						if (sys.qos > 0)		text += ' | QoS';
						if (sys.firewall > 0)	text += ' | 防火墙'
						if (sys.tdma > 0)		text += ' | TDMA';
						if (sys.atf > 0)		text += ' | ATF';
					}
					$('#qz-local-sts').text(text);
				}
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
					$('#qz-set-gws-rgn').val(rgn);
					$('#qz-set-gws-ch').val(ch);

					freq = (rgn > 0) ? 474+(ch-21)*8 : 473+(ch-14)*6;
					bw = ("bw" in gws) ? gws.bw : -1;
					if (bw > 0) {
						text = freq+'MHz - '+bw+'M';
					} else {
						text = freq+'MHz - (未知)';
					}
					$('#qz-local-gws2').text(text);

					txpwr = ("txpwr" in gws) ? gws.txpwr : -99;
					tpc = ("tpc" in gws) ? gws.tpc : -1;
					if (txpwr >= -15) {
						text = txpwr+' dBm';
					} else {
						text = '发射关闭';
					}
					text += ' - ';
					if (tpc > 0) {
						text += 'TPC打开';
					} else if (tpc == 0) {
						text += 'TPC关闭';
					} else {
						text += '禁用TPC';
					}
					$('#qz-local-gws3').text(text);
					$('#qz-set-gws-txpwr').val(txpwr);


					rxgain = ("rxg" in gws) ? gws.rxg : -99;
					agc = ("agc" in gws) ? gws.agc : -1;
					if (rxgain > -99) {
						text = rxgain+' dB';
					} else {
						text = '0';
					}
					text += ' - ';
					if (agc > 0) {
						text += 'AGC打开';
					} else if (agc == 0) {
						text += 'AGC关闭';
					} else {
						text += '禁用AGC';
					}
					$('#qz-local-gws4').text(text);
					$('#qz-set-gws-rxg').val(rxgain > -99 ? rxgain : '-');

					text = ("note" in gws) ? gws.note : '...';
					$('#qz-local-gws5').text(text);
					
if (store.debug)
					console.log("射频> region/channel/txpwr/tpc/rxgain/agc", rgn, ch, txpwr, tpc, rxgain, agc);
				}
			}
		},
		redraw: function() {
			// update chart
			$.flot.update();
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
				var text = '<div class="container section center">(演示模式，请先<a href="/grid/index.html">登录</a>)</div>'
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
					//console.log('> toast() when click', obj);
					$.materialize.toast('演示模式下不可用');
				});
			} else {
				// bind these buttons click() 
				$('#qz-btn-sys-reset').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('重启设备');
					$('#qz-modal-chcfm-affected').text('此操作将设备重新启动，所有服务都将受到影响');
					$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'sys');
				});

				$('#qz-btn-abb-reset').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('模拟基带重置');
					$('#qz-modal-chcfm-affected').text('此操作将重置设备的模拟基带，无线通信将受到影响');
					$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'abb');
				});

				$('#qz-btn-gws-reset').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('射频重置');
					$('#qz-modal-chcfm-affected').text('此操作将重置设备的射频链路，无线通信将受到影响');
					$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'gws');
				});

				$('#qz-btn-nw-reset').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('网络重置');
					$('#qz-modal-chcfm-affected').text('此操作将重置设备的网络配置，网络部分将受到影响，包括无线通信');
					$('#qz-btn-confirm-change').attr('ops', 'reset').attr('val', 'nw');
				});

				$('#qz-btn-fw-factory').click(function() { // 2017.02.28
					$('#qz-modal-chcfm-items').text('恢复出厂设置');
					$('#qz-modal-chcfm-affected').text('此操作将重置设备到出厂状态，所有当前的配置都有可能丢失');
					$('#qz-btn-confirm-change').attr('ops', 'init').attr('val', 'new');
				})

				$('#qz-btn-confirm-change').click(function() { // 2017.02.28
					var ops = $(this).attr('ops');
					var val = $(this).attr('val');
if (store.debug)
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
 		bind: {
 			peer_btn: function() {
				$('.qz-btn-peer-proxy').click(function() {
					var mac = $(this).attr('alt');
					console.log('> prepare proxy dialog/modal. dev=', mac);
					$('.qz-btn-proxy-agree').attr('href', '/cgi-bin/proxy?target='+mac);
				});
 			}
 		},
 		tool: {
 			flood: function(obj) { // 2017.03.02
				var target = $('#qz-tool-flood-target').val();
				var times = $('#qz-tool-flood-times').val();
				var bw = $('#qz-tool-flood-bw').val();
				var as = $('#qz-tool-flood-as').attr('checked');

if (store.debug)
				console.log('工具> flooding now: to/times/bw/as =', target, times, bw, as);
				$.ops.ajax('flood', '/cgi-bin/tool', {
					k: 'flood', to: target, times: times, bw: bw
				}, obj);
			},
			ping: function(obj) { // 2017.03.02
				var target = $('#qz-tool-ping-target').val();
				var times = 4;
				//var times = $('#qz-tool-ping-times').val();

if (store.debug)
				console.log('工具> ping now ...', target, times);
				$.ops.ajax('ping', '/cgi-bin/tool', {
					k: 'ping', to: target, times: times
				}, obj);
			}
 		},
		change: function(obj) { // 2017.02.28
			if (obj.qz._val != '' && obj.qz._val != '-') {
if (store.debug)
				console.log('save >', obj.qz._com, obj.qz._item, obj.qz._val);

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
				//console.dir('dbg> $.get with resp', resp);
				switch(ops) {
				case 'abb':
					prompt = '模拟基带部分已重置';
					break;
				case 'gws':
					prompt = '射频部分已重置';
					break;
				case 'nw':
					prompt = '网络部分已重置';
					break;
				case 'sys':
					prompt = '设备正在重启，请稍候';
					break;
				case 'flood':
					prompt = 'Flooding目标已完成';
					break;
				case 'ping':
					// TODO: set result to "textarea"
					prompt = 'Ping诊断已完成';
					$('#qz-tool-ping-result').val(resp);
					break;
				default:
					prompt = '操作已完成';
					break;
				}
				//console.log('ajax (ok) result:', prompt);

				$.materialize.toast(prompt);

				// reset nw: reload
				// reset sys: close
				$.ops.ajax_done(ops);

				// release button or input
				if (obj) $.ui.obj.enable(obj);
			})
			.fail(function(resp) { // 2017.02.28
				//console.dir('dbg> $.get failed with resp', resp);
				switch(ops) {
				case 'nw':
					prompt = '网络部分已重置';
					break;
				case 'sys':
					prompt = '设备正在重启，请稍候';
					break;
				case 'flood':
					prompt = 'Flooding目标失败 ！';
					break;
				case 'ping':
					// TODO: set result to "textarea"
					prompt = 'Ping诊断失败 ！';
					$('#qz-tool-ping-result').val(resp);
					break;
				default:
					prompt = '操作失败 ！ ';
					break;
				}
				//console.log('ajax (fail) result:', prompt);
				
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
				$.materialize.toast('因网络重置，重新载入页面');
				setTimeout("$.url.reload()", 3000);
				break;
			case 'sys':
				$.materialize.toast('因设备重启，正在关闭此设备', 5000);
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
				//console.log('dbg>', text);
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
			instant: function() { // 2017.03.06
				$.cache.update.instant();
				$.ui.redraw();
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
			$.ui.redraw();
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
	console.log("* NOTICE: CURRENT ONLY AVAILABLE FOR SINGLE PEER!");
	var m = $.url.get('k') || 'demo';
	$.app.run(m);
});


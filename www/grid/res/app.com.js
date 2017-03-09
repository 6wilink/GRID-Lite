// by 6Harmonics Qige @ 2017.02.18

//TODO:
// 1. handle too much ajax failed: if device offline, then close
// 2. calc ajax interval in ms, re-calibrate thrpt
// 3. manage peers, and test if peers left, redraw charts



// public data object
var store = {
	// default is 'DEMO' ('realtime', 'proxy')
	mode: 'demo',
	debug: 0,

	invalid: -999,

	invalid: -999,

	// ajax failes when gws reboot
	offlineCounter: 0,
	offlineCounterBar: 6,

	// 200 records for each chart
	defaultRecordQty: 200, 

	// flot related data
	flot: {
		fields: 'all',
		// setInterval handlers
		intl: {
			local: {
				instant: null,
				delayed: null
			},
			peers: [],
			DEMO: null
		},
		// color index for Flot charts
		color: [
			'lime', 'red', 'blue', 'purple', 'deep-purple', 
			'indigo', 'pink', 'light-blue', 'cyan', 'teal', 
			'green', 'light-green', 'yellow', 'amber', 'orange', 
			'deep-orange', 'brown', 'grey', 'blue-grey'
		],
		// chart handlers
		chart: [],
	},

	// every ajax query result
	query: null,
	query_last: null,

	// save these parameters not frequently updated
	// and not calculate gap between each time
	delayed: null, 

	// history data
	history: {
		local: {
			snr: [],
			br: [],
			eth_tx_thrpt: [], eth_rx_thrpt: [],
			wls_tx_thrpt: [], wls_rx_thrpt: []
		}
	},

	// peers proxy data
	proxy: null
}; // store

// window.location.href
// @2016.12.31
(function($) {
	$.url = {
		// get value by key from url
		get: function(key) {
			var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
			var r = window.location.search.substr(1).match(reg);
			if (r != null) return unescape(r[2]); return null;
		},
		// redirect
		goto: function(url, reason) {
			if (confirm('Will leave current page due to ' + reason)) {
					$(window.location).attr('href', url);
			}
		},
		// wrapper when ajax fail
		check: function(url, reason) {
			if (store.offlineCounter == store.offlineCounterBar)
				$.url.goto(url, reason);
		},
		// "F5" refresh
		reload: function() {
			window.location.reload();
		},
		// "^W"
		close: function() {
			window.opener = null; window.open(".", "_self"); window.close();
			if (window) { window.location.href = "about: blank"; }
		}
	};
}) (jQuery);


// Materialize controller
// @2017.02.18
(function($) {
	$.materialize = {
		init: function() {
			$('.modal').modal();
		},
		toast: function(msg, timeout) {
			if (msg) {			
				var $toastContent = $('<span>'+msg+'</span>');
				Materialize.toast($toastContent, timeout || 3000);
			}
		}
	}
}) (jQuery); //$.materialize


// Flot controller
(function($) {
	$.flot = {
		// init chart of local
		init: function() {
			var flots = $('.qz-chart-holder');
			var local = flots.first();
			var local_chart = $.flot.chart.new(0, local);
			store.flot.chart.length = 0;
			store.flot.chart.push(local_chart);
			$.flot.bg(0, local);
		},
		// add flot chart background color
		bg: function(idx, item) {
				var color = $.flot.color(idx) || 'cyan';
				if (typeof(item) == 'object') {
					item.addClass(color)
					.resize(function() { if (store.debug) console.log('Flot Chart(s) resized.'); });
				}
		},
		// init & create a flot chart, return handler
		chart: {
			new: function(idx, item) { // 2017.03.01
				var data = [{
					label: '> 噪声 (dBm)', data: []
				},{
					label: '< 有线发送(Mbps)', data: []
				},{
					label: '< 有线接收(Mbps)', data: []
				},{
					label: '< 无线发送(Mbps)', data: []
				},{
					label: '< 无线接收(Mbps)', data: []
				}];
				var flot = $.plot(item, data, {
					series: {
						//stack: true, // stack lines
						//points: { show: true },
						lines: {
							show: true,
							//fill: true,
							//steps: true,
						},
						shadowSize: 0 // remove shadow to draw faster
					},
					crosshair: {
						mode: 'y'
					},
					grid: {
						//hoverable: true,
						//clickable: true
					},
					xaxis: {
						show: true, tickDecimals: 0, min: 0, max: 59
					},
					yaxes: [{
						show: true, min: 0, max: 32,
						steps: true
					},{
						show: true, tickDecimals: 0, min: -110, max: -78,
						//alignTicksWithAxis: 1, 
						//steps: true,
						position: 'right'
					}],
					// TODO: fix legend size
					legend: {
						//position: 'sw',
						show: true
					}
				});
				return flot;
			},
			peer: function(item) {
				var data = [{
					label: '< 接收比特率(Mbit/s)', data: []
				},{
					label: '< 发送比特率(Mbit/s)', data: []
				},{
					label: '<< 接收MCS', data: []
				},{
					label: '<< 发送MCS', data: []
				},{
					label: '> 信噪比 (db)', data: []
				}];
				var flot = $.plot(item, data, {
					series: {
						lines: {
							show: true
						},
						shadowSize: 0
					},
					crosshair: {
						mode: 'y'
					},
					xaxis: {
						show: true, tickDecimals: 0, min: 0, max: 59
					},
					yaxes: [{
						show: true, min: 0, max: 32,
						steps: true
					},{
						show: true, tickDecimals: 0, min: 0, max: 64,
						position: 'right'
					},{
						show: true, tickDecimals: 0, min: 0, max: 8,
						position: 'left'
					}],
					legend: {
						show: true
					}
				});
				return flot;
			},
			// update & redraw chart
			update: function(flot, data) { // 2017.02.28
				flot.setData(data);
				flot.draw();		
			}
		},
		// save value to object with max length
		one: function(array, val, qty_max) { // 2017.02.01
			var max = qty_max || store.defaultRecordQty;
			if (array) {
				if (array.length >= max) {
					array.shift();
				}
			} else {
				array = [];
			}
			array.push(val);
			return array;
		},
		// get color string from color table
		color: function(idx) { // 2017.02.01
			return store.flot.color[idx];
		},
		sync: {
			local: function() { // 2017.03.01
				var i, j;

				var invalid = store.invalid;

				var fcharts = store.flot.chart;
				var chart = fcharts[0];

				var noise = store.history.local.noise;
				var eth_tx_thrpt = store.history.local.eth_tx_thrpt;
				var eth_rx_thrpt = store.history.local.eth_rx_thrpt;
				var wls_tx_thrpt = store.history.local.wls_tx_thrpt;
				var wls_rx_thrpt = store.history.local.wls_rx_thrpt;

				var fd_noise = [], fd_wls_tx_thrpt = [], fd_wls_rx_thrpt = [];
				var fd_eth_tx_thrpt = [], fd_eth_rx_thrpt = [];

				if (noise && noise.length > 0) {
					for(i = 0, j = noise.length; i < noise.length; i ++) {
						var val = noise[i];
						if (val > invalid) {
							fd_noise.push([j-i-1, val]);
						} else {
							fd_noise.push(null);
						}
					}
				}

				if (eth_tx_thrpt && eth_tx_thrpt.length > 0) {
					for(i = 0, j = eth_tx_thrpt.length; i < eth_tx_thrpt.length; i ++) {
						fd_eth_tx_thrpt.push([j-i-1, eth_tx_thrpt[i]]);
					}
				}

				if (eth_rx_thrpt && eth_rx_thrpt.length > 0) {
					for(i = 0, j = eth_rx_thrpt.length; i < eth_rx_thrpt.length; i ++) {
						fd_eth_rx_thrpt.push([j-i-1, eth_rx_thrpt[i]]);
					}
				}

				if (wls_tx_thrpt && wls_tx_thrpt.length > 0) {
					for(i = 0, j = wls_tx_thrpt.length; i < wls_tx_thrpt.length; i ++) {
						fd_wls_tx_thrpt.push([j-i-1, wls_tx_thrpt[i]]);
					}
				}


				if (wls_rx_thrpt && wls_rx_thrpt.length > 0) {
					for(i = 0, j = wls_rx_thrpt.length; i < wls_rx_thrpt.length; i ++) {
						fd_wls_rx_thrpt.push([j-i-1, wls_rx_thrpt[i]]);
					}
				}

				// custom chart lines
				var cd;
				var _fields = store.flot.fields;
				if (_fields == 'eth') {
					cd = [
						{ label: '> 噪声', data: null, yaxis: 2 },
						{ label: '< 有线发送速率', data: fd_eth_tx_thrpt },
						{ label: '< 有线接收速率', data: fd_eth_rx_thrpt },
						{ label: '< 无线发送速率', data: null },
						{ label: '< 无线接收速率', data: null }
					];
				} else if (_fields == 'wls') {
					cd = [
						{ label: '> 噪声', data: null, yaxis: 2 },
						{ label: '< 有线发送速率', data: null },
						{ label: '< 有线接收速率', data: null },
						{ label: '< 无线发送速率', data: fd_wls_tx_thrpt },
						{ label: '< 无线接收速率', data: fd_wls_rx_thrpt }
					];
				} else if (_fields == 'abb') {
					cd = [
						{ label: '> 噪声', data: fd_noise, yaxis: 2 },
						{ label: '< 有线发送速率', data: null },
						{ label: '< 有线接收速率', data: null },
						{ label: '< 无线发送速率', data: null },
						{ label: '< 无线接收速率', data: null }
					];
				} else {
					cd = [
						{ label: '> 噪声', data: fd_noise, yaxis: 2 },
						{ label: '< 有线发送速率', data: fd_eth_tx_thrpt },
						{ label: '< 有线接收速率', data: fd_eth_rx_thrpt },
						{ label: '< 无线发送速率', data: fd_wls_tx_thrpt },
						{ label: '< 无线接收速率', data: fd_wls_rx_thrpt }
					];
				}

				$.flot.chart.update(chart, cd);
			},
			// when peer_qty > fcharts_qty + 1(local), add new charts
			// when peer_qty = fcharts_qty + 1, only update each charts
			// when peer_qty < fcharts_qty + 1, remove last chart

			// update chart with given "store.history.peers"
			// with given order
			peers: function() {
				var invalid = store.invalid;

				var peers = (store.history && "peers" in store.history) ? store.history.peers : null;
				var peers_qty = (peers) ? peers.length : 0;

				var fcharts = store.flot.chart;
				var fcharts_qty = fcharts.length;
				var fcharts_to_gap = peers_qty - (fcharts_qty - 1);

				// add/remove current charts
				//console.log('DEBUG> peers qty/flot charts qty=', peers_qty, fcharts_qty);
				//console.log('DEBUG> Flot charts qty adjust=', fcharts_to_gap);
				if (fcharts_to_gap > 0) {
					$.flot.peers.add(fcharts_to_gap);
				} else if (fcharts_to_gap < 0) {
					$.flot.peers.del(fcharts_to_gap);
				}

				if (peers_qty < 1) {
					$.html.abb.peer.offline();
				} else {
					var i;
					var history = (store && "history" in store) ? store.history : null;
					var peers_cache = (history && "peers" in history) ? history.peers : null;
					//console.log("peers_qty/history/cache", peers_qty, history, peers_cache);
					for(i = 0; i < peers_qty; i ++) {
						var peer_chart = fcharts[i+1];
						var peer_cache = peers_cache && peers_cache.length > i ? peers_cache[i] : null;

						//console.log("$.flot.update.peers()", peer_cache, peer_chart);
						if (peer_cache && peer_chart) {
							$.flot.peers.update(i, peer_cache, peer_chart);
						}
					}
				}
			}
		},
		peers: { // add html/flot charts to "#qz-peers"
			add: function(fcharts_to_gap) {
				var i;
				for(i = 1; i <= fcharts_to_gap; i ++) {
					$.html.abb.peer.add();
					var flot_box = $('.qz-chart-holder').last();
					var flot = $.flot.chart.peer(flot_box);
					store.flot.chart.push(flot);
				}
			},
			del: function(fcharts_to_gap) {
				var i, gap = 0 - fcharts_to_gap;
				for(i = 0; i < gap; i ++) {
					// get last flot chart handle, destroy it
					var _fchart = store.flot.chart.pop();
					$.flot.destroy(_fchart);
					// delete last chart html
					$.html.abb.peer.del();
				}
			}, 
			update: function(idx, peer_cache, peer_chart) {
				//console.log("dbg 0307> $.flot.peers.calc()", peer_cache, peer_chart);
				var invalid = store.invalid;

				var _peer_cd;
				var _rx_br = [], _rx_mcs = [], _tx_br = [], _tx_mcs = [], _snr_fd = [];

				var rx_br = (peer_cache && 'rx_br' in peer_cache) ? peer_cache.rx_br : null;
				var rx_mcs = (peer_cache && 'rx_mcs' in peer_cache) ? peer_cache.rx_mcs : null;
				var tx_br = (peer_cache && 'tx_br' in peer_cache) ? peer_cache.tx_br : null;
				var tx_mcs = (peer_cache && 'tx_mcs' in peer_cache) ? peer_cache.tx_mcs : null;
				var snr = (peer_cache && 'snr' in peer_cache) ? peer_cache.snr : null;

				if (rx_br && rx_br.length > 0) {
					for(i = 0, j = rx_br.length; i < rx_br.length; i ++) {
						var val = rx_br[i];
						if (val > invalid) {
							_rx_br.push([j-i-1, val]);
						} else {
							_rx_br.push(null);
						}
					}
				}

				if (rx_mcs && rx_mcs.length > 0) {
					for(i = 0, j = rx_mcs.length; i < rx_mcs.length; i ++) {
						var val = rx_mcs[i];
						if (val > invalid) {
							_rx_mcs.push([j-i-1, val]);
						} else {
							_rx_mcs.push(null);
						}
					}
				}

				if (tx_br && tx_br.length > 0) {
					for(i = 0, j = tx_br.length; i < tx_br.length; i ++) {
						var val = tx_br[i];
						if (val > invalid) {
							_tx_br.push([j-i-1, val]);
						} else {
							_tx_br.push(null);
						}
					}
				}

				if (tx_mcs && tx_mcs.length > 0) {
					for(i = 0, j = tx_mcs.length; i < tx_mcs.length; i ++) {
						var val = tx_mcs[i];
						if (val > invalid) {
							_tx_mcs.push([j-i-1, val]);
						} else {
							_tx_mcs.push(null);
						}
					}
				}

				if (snr && snr.length > 0) {
					for(i = 0, j = snr.length; i < snr.length; i ++) {
						var val = snr[i];
						if (val > invalid) {
							_snr_fd.push([j-i-1, val]);
						} else {
							_snr_fd.push(null);
						}
					}
				}

				_peer_cd = [
					{ label: '< 接收比特率(Mbit/s)', data: _rx_br },
					{ label: '< 发送比特率(Mbit/s)', data: _tx_br },
					{ label: '<< 接收MCS', data: _rx_mcs, yaxis: 3 },
					{ label: '<< 发送MCS', data: _tx_mcs, yaxis: 3 },
					{ label: '> 信噪比(db)', data: _snr_fd, yaxis: 2 }
				];

				$.flot.chart.update(peer_chart, _peer_cd);
			}
		},
		// parse store.history"
		// redraw flot charts when done
		update: function() { // 2017.02.28
			$.flot.sync.local();
			$.flot.sync.peers();
		},
		destroy: function(chart) {
			chart.destroy();
		}
	}
}) (jQuery); // $.flot


// operate peers html
(function($) {
	$.html = {
		abb: {
			peer: {
				add: function() {
					var _h1 = $.html.abb.peer_html.new();
					var _h2 = $('#qz-peers').html();
					$('#qz-peers').html(_h2+_h1);

					// bind click()
					$.ops.bind.peer_btn();

					// remove "offline" tips
					$('#qz-peers-none').remove();
				},
				del: function() {
					$('.qz-peer-chart-n').last().remove();
				},
				offline: function() {
					var _h = $.html.abb.peer_html.empty();
					$('#qz-peers').html(_h);
				}				
			},
			peer_html: {
				new: function() {
					return `
<div class="col s12 qz-peer-chart-n">
	<div class="card">
		<div class="card-image waves-effect waves-block waves-light">
			<div class="qz-space">
				<div class="qz-chart-holder qz-chart-peer lighten-5"></div>
			</div>
		</div>
		<div class="card-content center">
			<p class="card-title activator grey-text text-darken-4 qz-peer-name">...</p>
			<p class="qz-peer-desc">...</p>
		</div>
		<div class="card-reveal">
			<span class="card-title grey-text text-darken-4">射频参数<i class="material-icons right">.</i></span>
				<ul class="collection">
				<li class="collection-item"><span class="badge qz-peer-txpwr">...</span>发射功率</li>
				<li class="collection-item"><span class="badge qz-peer-rxg">...</span>接收增益</li>
				<li class="collection-item"><span class="badge qz-peer-rxagc">...</span>自动增益控制AGC</li>
				<li class="collection-item"><span class="badge qz-peer-tpc">...</span>发射功率控制TPC</li>
				<li class="collection-item"><span class="badge qz-peer-atf">...</span>ATF</li>
				<li class="collection-item"><span class="badge qz-peer-tdma">...</span>TDMA</li>
			</ul>
		</div>
		<div class="card-action">
			<a href="#model_proxy_leagal" class="qz-btn-peer-proxy" alt="">管理</a>
		</div>
	</div>
</div>
					`;
				},
				empty: function() {
					return '<div id="qz-peers-none" class="col s12 section">( 暂未连接 )</div>';
				},
			},
		}
	}
}) (jQuery);

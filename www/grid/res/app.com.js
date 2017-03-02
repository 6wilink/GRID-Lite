// by 6Harmonics Qige @ 2017.02.18

//TODO:
// 1. handle too much ajax failed: if device offline, then close
// 2. calc ajax interval in ms, re-calibrate thrpt
// 3. manage peers, and test if peers left, redraw charts



// public data object
var store = {
	// default is 'DEMO' ('realtime', 'proxy')
	mode: 'demo',

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
			local: null,
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

	// history data
	history: {
		local: {
			snr: [],
			br: [],
			eth_thrpt: [],
			wls_thrpt: []
		}
	}
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
					.resize(function() { console.log('Flot Chart(s) resized.'); });
				}
		},
		// init & create a flot chart, return handler
		chart: {
			new: function(idx, item) { // 2017.03.01
				var data = [{
					label: '&lt; Bitrate (Mbit/s)', data: []
				},{
					label: '> SNR (db)', data: []
				},{
					label: '< Eth0 (Mbps)', data: []
				},{
					label: '< Wlan0 (Mbps)', data: []
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
						mode: 'xy'
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
						show: true, tickDecimals: 0, min: 0, max: 64,
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
		// 
		save: function() {

		},
		redraw: {
			local: function() { // 2017.03.01
				var i, j;

				var fcharts = store.flot.chart;
				var chart = fcharts[0];

				var snr = store.history.local.snr;
				var br = store.history.local.br;
				var eth_thrpt = store.history.local.eth_thrpt;
				var wls_thrpt = store.history.local.wls_thrpt;

				var fd_snr = [], fd_br = [], fd_wls_thrpt = [], fd_eth_thrpt = [];

				if (snr && snr.length > 0) {
					for(i = 0, j = snr.length; i < snr.length; i ++) {
						var val = snr[i];
						if (val >= 0) {
							fd_snr.push([j-i-1, val]);
						} else {
							fd_snr.push(null);
						}
					}
				}

				if (br && br.length > 0) {
					for(i = 0, j = br.length; i < br.length; i ++) {
						var val = br[i];
						if (val >= 0) {
							fd_br.push([j-i-1, val]);
						} else {
							fd_br.push(null);
						}
					}
				}

				if (eth_thrpt && eth_thrpt.length > 0) {
					for(i = 0, j = eth_thrpt.length; i < eth_thrpt.length; i ++) {
						fd_eth_thrpt.push([j-i-1, eth_thrpt[i]]);
					}
				}

				if (wls_thrpt && wls_thrpt.length > 0) {
					for(i = 0, j = wls_thrpt.length; i < wls_thrpt.length; i ++) {
						fd_wls_thrpt.push([j-i-1, wls_thrpt[i]]);
					}
				}

				// custom chart lines
				var cd;
				var _fields = store.flot.fields;
				if (_fields == 'nw') {
					cd = [{ label: '< Bitrate', data: null },
						{ label: '> SNR', data: null, yaxis: 2 },
						{ label: '< DL Thrpt', data: fd_eth_thrpt },
						{ label: '< UL Thrpt', data: fd_wls_thrpt }
					];
				} else if (_fields == 'abb') {
					cd = [{ label: '< Bitrate', data: fd_br },
						{ label: '> SNR', data: fd_snr, yaxis: 2 },
						{ label: '< Eth0 Thrpt', data: null },
						{ label: '< Wlan0 Thrpt', data: null }
					];
				} else {
					cd = [{ label: '< Bitrate', data: fd_br },
						{ label: '> SNR', data: fd_snr, yaxis: 2 },
						{ label: '< Eth0 Thrpt', data: fd_eth_thrpt },
						{ label: '< Wlan0 Thrpt', data: fd_wls_thrpt }
					];
				}

				$.flot.chart.update(chart, cd);
			},
			peers: function() {

			}
		},
		// parse store.history"
		// redraw flot charts when done
		sync: function() { // 2017.02.28
			$.flot.redraw.local();
			$.flot.redraw.peers();
		}
	}
}) (jQuery); // $.flot

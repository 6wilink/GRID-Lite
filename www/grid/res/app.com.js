// by 6Harmonics Qige @ 2017.02.18

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
	query: {
		cache: null,
		cache_last: null
	},

	// history data
	history: null
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
			new: function(idx, item) {
				var flot = $.plot(item, [{ label: 'Thrpt', data: [] }, { label: 'SNR', data: [] }], {
					series: {
						//stack: true, // stack lines
						//lines: { show: true },
						//points: { show: true },
						shadowSize: 0 // remove shadow to draw faster
					},
					grid: {
						//hoverable: true,
						//clickable: true
					},
					xaxis: { show: true, tickDecimals: 0, min: 0, max: 59 },
					yaxis: { show: true, min: 0, max: 30 },
					// TODO: fix legend size
					legend: { show: true }
				});
				return flot;
			},
			// update & redraw chart
			update: function(flot, data) {
				flot.setData(data);
				flot.draw();		
			}
		},
		// save value to object with max length
		one: function(data_obj, val, qty_max) {
			var max = qty_max || store.defaultRecordQty;
			if (data_obj) {
				if (data_obj.length >= max) {
					data_obj.shift();
				}
			} else {
				data_obj = [];
			}
			data_obj.push(val);
			return data_obj;
		},
		// get color string from color table
		color: function(idx) {
			return store.flot.color[idx];
		},
		// 
		save: function() {

		},
		redraw: {
			local: function() {
				var i, j;
				var flot_charts = store.flot.chart;

				var local_chart = flot_charts[0];
				var snr = store.history.local.snr;
				var thrpt = store.history.local.thrpt;
				var flot_d1 = [], flot_d2 = [];

				for(i = 0, j = snr.length; i < snr.length; i ++) {
					flot_d1.push([j - i - 1, snr[i]]);
				}

				for(i = 0, j = thrpt.length; i < thrpt.length; i ++) {
					flot_d2.push([j - i - 1, thrpt[i]]);
				}

				var chart1_combo = [{
					label: 'Thrpt', data: flot_d1,
				},{
					label: 'SNR', data: flot_d2, //yaxis: 2
				}];

				$.flot.chart.update(local_chart, chart1_combo);
			},
			peers: function() {

			}
		},
		// parse "store.query.cache", save to "store.history"
		// redraw flot charts when done
		sync: function() {
			console.log("$.Flot.sync()");
			$.flot.redraw.local();
			$.flot.redraw.peers();
		}
	}
}) (jQuery); // $.flot

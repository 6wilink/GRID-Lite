-- Data Collector
-- by Qige @ 2017.02.23

require 'grid.base.cgi'
require 'grid.base.user'
require 'grid.base.fmt'
require 'grid.Http'

require 'grid.abb'
require 'grid.gws'
require 'grid.nw'
require 'grid.sys'


Get = {}

function Get.Run()
	cgi.save.init()

	local _result = ''
	if (user.verify.remote()) then
		local _get = cgi.data._get
		local _k = fmt.http.find('k', _get)
		_k = 'sync'

		if (_k == 'gws') then
			_result = Get.ops.gws()
		elseif (_k == 'sync') then
			_result = Get.ops.all()
		else
			_result = string.format('unknown (%s)', _k)
		end
		Http.job.Reply(_result)
	else
		Http.data.Error('nobody');
	end
end


-- #define
Get.conf = {}
Get.conf.path_ok = '/grid/app.html?k=realtime'
Get.conf.path_error = '/grid/'
Get.conf.path_exit = '/grid/'

Get.cmd = {}
Get.cmd.fmt_reply = '{"result":"%s", "cmd":"%s"}'
Get.cmd.abb = {}
Get.cmd.abb.reGet = 'wifi'
Get.cmd.abb.ssid = 'uci Get wireless.@wifi-iface[0].ssid="%s"; uci commit wireless; wifi'

Get.cmd.nw = '/etc/init.d/network restart'
Get.cmd.sys = 'reboot'

Get.cmd.gws = {}
Get.cmd.gws.reGet = '/etc/init.d/gws_radio restart'
Get.cmd.gws.rgn = 'uci Get gws_radio.v1.region=%s; uci commit gws_radio'
Get.cmd.gws.rxg = 'uci Get gws_radio.v1.rxgain=%s; uci commit gws_radio'
Get.cmd.gws.ch = 'uci Get gws_radio.v1.channel=%s; uci commit gws_radio'


Get.ops = {}

-- ABB, GWS, Nw, System
-- abb.bssid, abb.ssid, abb.mode, abb.key, abb.snr, abb.txmcs, abb.rxmcs
-- abb.peer_qty, abb.peers[]
-- gws.region, gws.channle, gws.rxgain, gws.txpwr, gws.agc, gws.tpc, gws.freq, gws.chanbw
-- nw.bridge, nw.wan_ip, nw.wan_txb, nw.wan_rxb, nw.lan_ip, nw.lan_txb, nw.lan_rxb
-- sys.atf, sys.tdma, sys.dhcp, sys.firewall, sys.qos
function Get.ops.all()
	local _fmt = '{"abb": [%s], "gws": [%s], "nw": [%s], "sys": [%s], "ts": %d}'

	local _abb = Get.ops.abb()
	local _gws = Get.ops.gws()
	local _nw = Get.ops.nw()
	local _sys = Get.ops.sys()
	local _ts = os.time()

	local _result = string.format(_fmt, _abb, _gws, _nw, _sys, _ts)

	return _result
end


function Get.ops.abb()
	local _fmt = '{"bssid": "%s", "ssid": "%s", "mode": "%s", "key": "%s", "snr": %d, "noise": %d, "txmcs": %d, "rxmcs": %d }'
	local _abb = abb.ops.Update()
	_result = string.format(_fmt, _abb.bssid, _abb.ssid, _abb.mode, _abb.key, _abb.snr, _abb.noise, _abb.txmcs, _abb.rxmcs)
	return _result
end

function Get.ops.gws()
	local _fmt = '{"rgn": %d, "ch": %d, "rxg": %d, "txpwr": %d, "tpc": 0, "agc": 1 }'
	local _gws = gws.ops.Update()
	_result = string.format(_fmt, _gws.rgn, _gws.ch, _gws.rxg, _gws.txpwr, _gws.tpc, _gws.agc)
	return _result
end

function Get.ops.nw()
	local _fmt = '{"bridge": %d, "wan_ip": "%s", "wan_txb": %d, "wan_rxb": %d, "lan_ip": "%s", "lan_txb": %d, "lan_rxb": %d }'
	local _nw = nw.ops.Update()
	_result = string.format(_fmt, _nw.bridge, _nw.wan_ip, _nw.wan_rxb, _nw.wan_txb, _nw.lan_ip, _nw.lan_rxb, _nw.lan_txb)
	return _result
end

function Get.ops.sys()
	local _fmt = '{"atf": %d, "tdma": %d, "dhcp": %d, "firewall": %d, "qos": %d }'
	local _sys = sys.ops.Update()
	_result = string.format(_fmt, _sys.atf, _sys.tdma, _sys.dhcp, _sys.firewall, _sys.qos)
	return _result
end


return Get


-- 6Harmonics Qige @ K2E 7S4
-- 2017.03.01

require 'grid.base.cgi'
require 'grid.base.user'
require 'grid.base.fmt'
require 'grid.Http'

require 'grid.ABB'
require 'grid.GWS'
require 'grid.NW'
require 'grid.SYS'


Get = {}

function Get.Run()
	cgi.save.init()

	local _result = ''
	if (user.verify.remote()) then
		local _get = cgi.data._get
		local _k = fmt.http.find('k', _get)
		--_k = 'delayed'
		--_k = 'instant'

		if (_k == 'instant') then
			_result = Get.ops.instant()
		elseif (_k == 'delayed') then
			_result = Get.ops.delayed()
		else
			_result = string.format('unknown (%s)', _k or '[nil]')
		end
		Http.job.Reply(_result)
	else
		Http.data.Error('nobody');
	end
end


-- #define
Get.conf = {}


Get.ops = {}

-- ABB, Nw
-- abb.bssid, abb.ssid, abb.mode, abb.key, abb.snr, abb.txmcs, abb.rxmcs
-- abb.peer_qty, abb.peers[]
-- nw.bridge, nw.wan_ip, nw.wan_txb, nw.wan_rxb, nw.lan_ip, nw.lan_txb, nw.lan_rxb
function Get.ops.instant()
	local _fmt = '{ "abb": %s, "nw": %s, "ts": %d }'

	local _abb = Get.ops.abb()
	local _nw = Get.ops.nw()
	local _ts = os.time()

	local _result = string.format(_fmt, _abb, _nw, _ts)
	return _result
end

-- gws.region, gws.channle, gws.rxgain, gws.txpwr, gws.agc, gws.tpc, gws.freq, gws.chanbw
-- sys.atf, sys.tdma, sys.dhcp, sys.firewall, sys.qos
function Get.ops.delayed()
	local _fmt = '{ "gws": %s, "sys": %s, "ts": %d }'
	local _gws = Get.ops.gws()
	local _sys = Get.ops.sys()
	local _ts = os.time()

	local _result = string.format(_fmt, _gws, _sys, _ts)
	--_result = '{ "gws": null, "sys": null }'
	return _result
end


function Get.ops.abb()
	local _result = ABB.ops.Update()
	return _result
end

function Get.ops.gws()
	local _result = GWS.ops.Update()
	return _result
end

function Get.ops.nw()
	local _result = NW.ops.Update()
	--io.write('Get.ops.nw() ' .. _result .. '\n')
	return _result
end

function Get.ops.sys()
	local _result = SYS.ops.Update()
	return _result
end


return Get


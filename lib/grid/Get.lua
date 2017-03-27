-- Get instant(abb/nw)/delayed(gws/sys)
-- by Qige
-- 2016.04.05/2017.01.03/2017.03.24

local fmt = require 'six.fmt'

local ABB = require 'kpi.ABB'
local GWS = require 'kpi.GWS'
local NW = require 'kpi.NW'
local SYS = require 'kpi.SYS'

local cgi = require 'grid.base.cgi'
local user = require 'grid.base.user'


local Get = {}
Get._remote = ''
function Get.init()
	cgi.Save()
	Get._remote = cgi.raw._remote
end

function Get.Run()
	local _result = ''

	Get.init()
	
	local _remote = Get._remote
	if (user.verify.Remote(_remote)) then
		local _get = cgi.raw._get
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
		cgi.job.Reply(_result)
	else
		cgi.json.Error('nobody');
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
	local _result = ABB.JSON()
	return _result
end

function Get.ops.gws()
	local _result = GWS.JSON()
	return _result
end

function Get.ops.nw()
	local _result = NW.JSON()
	--io.write('Get.ops.nw() ' .. _result .. '\n')
	return _result
end

function Get.ops.sys()
	local _result = SYS.JSON()
	return _result
end


return Get


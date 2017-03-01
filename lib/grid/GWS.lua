-- GWS Controller
-- by Qige
-- 2017.02.23

GWS = {}

GWS.conf = {}
GWS.conf.rfinfo = 'rfinfo'


GWS.ops = {}
function GWS.ops.Update()
	local _result
	local _fmt = '{"rgn": %d, "ch": %d, "rxg": %d, "txpwr": %d, "tpc": 0, "agc": 1 }'

	local _gws = {}
	
	_gws.rgn = 1
	_gws.ch = 21
	_gws.txpwr = 21
	_gws.rxg = 10
	_gws.tpc = 0
	_gws.agc = 1
	
	_result = string.format(_fmt, _gws.rgn, _gws.ch, _gws.rxg, _gws.txpwr, _gws.tpc, _gws.agc)
	return _result
end

function GWS.ops.read()
end


return GWS
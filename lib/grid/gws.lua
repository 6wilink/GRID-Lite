-- GWS Controller
-- by Qige
-- 2017.02.23

gws = {}

gws.conf = {}
gws.conf.rfinfo = 'rfinfo'


gws.ops = {}
function gws.ops.Update()
	local _gws = {}
	
	_gws.rgn = 1
	_gws.ch = 21
	_gws.txpwr = 21
	_gws.rxg = 10
	_gws.tpc = 0
	_gws.agc = 1
	
	return _gws
end

function gws.ops.read()
end


return gws
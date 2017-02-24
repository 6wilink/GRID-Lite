-- abb Controller
-- by Qige
-- 2017.02.23

abb = {}

abb.conf = {}
abb.conf.rfinfo = 'rfinfo'


abb.ops = {}
function abb.ops.Update()
	local _abb = {}
	
	_abb.bssid = '00:00:00:00:00:01'
	_abb.ssid = 'gws5k-2017'
	_abb.mode = 'CAR'
	_abb.key = ''
	_abb.snr = 0
	_abb.noise = -101
	_abb.txmcs = -1
	_abb.rxmcs = -1
	
	return _abb
end

function abb.ops.read()
end


return abb
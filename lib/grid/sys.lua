

sys = {}

sys.ops = {}
function sys.ops.Update()
	local _sys = {}

	_sys.atf = -1
	_sys.tdma = -1
	_sys.dhcp = 0
	_sys.firewall = 1
	_sys.qos = 1

	return _sys
end

return sys
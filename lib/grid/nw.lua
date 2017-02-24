

nw = {}

nw.ops = {}
function nw.ops.Update()
	local _nw = {}
	
	_nw.bridge = 0
	_nw.wan_ip = '10.10.1.3'
	_nw.wan_rxb = 1
	_nw.wan_txb = 2
	_nw.lan_ip = '192.168.66.1'
	_nw.lan_rxb = 3
	_nw.lan_txb = 4

	return _nw
end

return nw
-- 6Harmonics Qige @ K2E 7S4
-- 2017.03.01

require 'grid.base.cmd'
require 'grid.base.conf'

require 'grid.ABB'


NW = {}


NW.conf = {}
NW.conf.eth_ifname = 'eth0'
NW.conf.wls_ifname = 'wlan0'
NW.conf.ap_ifname = 'br-lan'


NW.cache = {}

NW.cache._bridge = 0
NW.cache._eth_ip = ''
NW.cache._wls_ip = ''

NW.cache._eth_txb = 0
NW.cache._eth_rxb = 0
NW.cache._wls_txb = 0
NW.cache._wls_rxb = 0

NW.cache.ts = os.time()


NW.ops = {}
function NW.ops.Update()
	local _result
	local _fmt = '{"bridge": %d, "wan_ip": "%s", "lan_ip": "%s"'
	_fmt = _fmt .. ' ,"eth_rxb": %d, "eth_txb": %d, "wls_rxb": %d, "wls_txb": %d }'

	local _data = NW.ops.read()
	_result = string.format(_fmt, _data.bridge or 1, 
		_data.wan_ip or '-', _data.lan_ip or '-', 
		_data.eth_rxb or 0, _data.eth_txb or 0, 
		_data.wls_rxb or 0, _data.wls_txb or 0)

	return _result
end


function NW.ops.conf()
	if (conf.uci.get('network', 'lan', 'type') == 'bridge') then
		NW.cache._bridge = 1
	else
		NW.cache._bridge = 0
	end
	NW.cache._wls_ip = conf.uci.get('network', 'lan', 'ipaddr')
	NW.cache._eth_ip = conf.uci.get('network', 'wan', 'ipaddr')
end

-- TODO: fix CAR with muilti EARs
function NW.ops.thrpt()
	local wls_mode = ABB.cache.mode()
	if (wls_mode == 'CAR' or wls_mode == 'Mesh') then
		wls_ifname = NW.conf.ap_ifname
		eth_ifname = NW.conf.eth_ifname
	else
		wls_ifname = NW.conf.wls_ifname
		eth_ifname = NW.conf.eth_ifname
	end

	-- read LAN rxbytes, txbytes
	local _wls_rxbtxb = NW.get.rxbtxb(wls_ifname)
	if (_wls_rxbtxb and #_wls_rxbtxb >= 2) then
		NW.cache._wls_rxb = _wls_rxbtxb[1]
		NW.cache._wls_txb = _wls_rxbtxb[2]
	else
		NW.cache._wls_rxb = 0
		NW.cache._wls_txb = 0
	end

	-- read WAN rxbytes, txbytes
	local _eth_rxbtxb = NW.get.rxbtxb(eth_ifname)
	if (_eth_rxbtxb and #_eth_rxbtxb >= 2) then
		NW.cache._eth_rxb = _eth_rxbtxb[1]
		NW.cache._eth_txb = _eth_rxbtxb[2]
	else
		NW.cache._eth_rxb = 0
		NW.cache._eth_txb = 0
	end
end

function NW.ops.read()
	local _nw = {}
	
	-- call for update
	NW.ops.conf()
	NW.ops.thrpt()

	_nw.bridge = NW.cache._bridge
	_nw.wan_ip = NW.cache._eth_ip
	_nw.lan_ip = NW.cache._wls_ip

	_nw.eth_rxb = fmt.n(NW.cache._eth_rxb)
	_nw.eth_txb = fmt.n(NW.cache._eth_txb)
	_nw.wls_rxb = fmt.n(NW.cache._wls_rxb)
	_nw.wls_txb = fmt.n(NW.cache._wls_txb)

	return _nw
end


NW.get = {}

-- read rxbytes, txbytes
-- /proc/net/dev col2=rxbytes, col10=txbytes
function NW.get.rxbtxb(ifname)
	local _fmt = "cat /proc/net/dev | grep %s -m1 | awk '{print $2,$10}'\n"
	local _cmd = string.format(_fmt, ifname)

	local _bytes = cmd.exec(_cmd)

	local _rxbtxb
	if (_bytes) then
		_rxbtxb = fmt.cli.parse(_bytes, ' ')
	end

	return _rxbtxb
end


return NW
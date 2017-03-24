

SYS = {}

SYS.ops = {}

function SYS.ops.Update()
	local _result
	local _fmt = '{"atf": %d, "tdma": %d, "dhcp": %d, "firewall": %d, "qos": %d }'

	local _data = {}

	_data.atf = -1
	_data.tdma = -1
	_data.dhcp = 0
	_data.firewall = 1
	_data.qos = 1

	_result = string.format(_fmt, _data.atf, _data.tdma, _data.dhcp, _data.firewall, _data.qos)
	return _result
end

return SYS
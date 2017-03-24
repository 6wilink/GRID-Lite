-- 6Harmonics Qige @ K2E 7S4
-- 2017.03.01

require 'grid.base.cgi'
require 'grid.base.user'
require 'grid.base.fmt'
require 'grid.Http'
require 'grid.Scan'


Tool = {}


-- #define
Tool.conf = {}
Tool.conf.flood_cmd_fmt = "iperf -u -c %s -t %d -b %dM"
Tool.conf.dfl_flood_bw = 10
Tool.conf.dfl_flood_times = 10

Tool.conf.ping_cmd_fmt = "ping %s -w %d"
Tool.conf.dfl_ping_times = 4

-- for spectrum/channel scan, quiet mode
Tool.conf.chscan_file = '/tmp/.grid_lite_chscan'
--Tool.conf.chscan_cmd_fmt = 'gws_cs -q -r%d -b%d -e%d > %s'
Tool.conf.chscan_abord_cmd = 'killall gws_cs; sleep 1; echo > %s'
Tool.conf.chscan_read_cmd_fmt = "cat %s | grep ,%d, | awk -F ',' '{print $4}'"

function Tool.Run()
	cgi.save.init()

	local _result = ''
	--if (user.verify.remote()) then
		local _get = cgi.data._get
		local _k = fmt.http.find('k', _get)
		--_k = 'scan'

		if (_k == 'ping') then
			local _to = fmt.http.find('to', _get)
			local _times = fmt.http.find('times', _get) or 4
			_result = Tool.ops.ping(_to, _times)
		elseif (_k == 'flood') then
			local _to = fmt.http.find('to', _get) or ''
			local _times = fmt.http.find('times', _get)
			local _bw = fmt.http.find('bw', _get)
			_result = Tool.ops.flood(_to, _times, _bw)
		elseif (_k == 'scan') then
			local _b = fmt.http.find('b', _get) or 21
			local _e = fmt.http.find('e', _get) or 51
			local _rgn = fmt.http.find('r', _get) or 1
			_result = Tool.ops.scan(_rgn, _b, _e)
		elseif (_k == 'scan_abord') then
			_result = Tool.ops.scan_abord()
		elseif (_k == 'scan_read') then
			local _ch = fmt.http.find('ch', _get) or 45
			_result = Tool.ops.scan_read(_ch)
		else
			_result = string.format('unknown (%s)', _k or '[nil]')
		end
		Http.job.Reply(_result)
	--else
		--Http.data.Error('nobody');
	--end
end



Tool.ops = {}

function Tool.ops.flood(_to, _times, _bw)
	local _msg = string.format('flooding [%s] with [%d] Mbps for [%d] times', 
		_to, _bw, _times)

	if (_to) then
		local _fmt = Tool.conf.flood_cmd_fmt
		local _cmd = string.format(_fmt, _to or '', 
			_times or Tool.conf.dfl_flood_times, _bw or Tool.conf.dfl_flood_bw)
		cmd.exec(_cmd)

		_result = '{"error": null, "result": "ok"}'
	else
		_result = '{"error": "unknown target"}'
	end

	return _result
end

function Tool.ops.ping(_to, _times)
	local _msg = string.format('ping [%s] for [%d] times', _to, _times)

	if (_to) then
		local _fmt = Tool.conf.ping_cmd_fmt
		local _cmd = string.format(_fmt, _to, _times)
		local _prompt = cmd.exec(_cmd)

		_result = string.format('%s', _prompt)
	else
		_result = '{"error": "unknown target"}'
	end

	return _result
end

function Tool.ops.scan(_rgn, _b, _e)
	SScan.Run(_rgn, _b, _e)
	local _result = '{"error": null, "result": "ok"}'
	return _result
end

function Tool.ops.scan_abord()
	local _f = Tool.conf.chscan_file
	local _fmt = Tool.conf.chscan_abord_cmd
	local _cmd = string.format(_fmt, _f)
	cmd.exec(_cmd)

	local _result = '{"error": null, "result": "off"}'
	return _result
end

function Tool.ops.scan_read(_ch)
	local _f = Tool.conf.chscan_file
	local _fmt = Tool.conf.chscan_read_cmd_fmt
	local _ch_ = fmt.n(_ch) or 45
	local _cmd = string.format(_fmt, _f, _ch_)
	local _noise = fmt.n(cmd.exec(_cmd)) or -88

	local _result_fmt = '{"error": null, "result": "ok", "data": { "ch": %d, "noise": %d }}'
	local _result = string.format(_result_fmt, _ch_, _noise)
	--local _result = string.format('f=%s;cmd=%s;ch=%d;noise=%d', _f, _cmd, _ch_, _noise)
	return _result
end

return Tool


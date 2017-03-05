-- 6Harmonics Qige @ K2E 7S4
-- 2017.03.01

require 'grid.base.cgi'
require 'grid.base.user'
require 'grid.base.fmt'
require 'grid.Http'


Tool = {}


-- #define
Tool.conf = {}
Tool.conf.flood_cmd_fmt = "iperf -u -c %s -t %d -b %dM"
Tool.conf.dfl_flood_bw = 10
Tool.conf.dfl_flood_times = 10

Tool.conf.ping_cmd_fmt = "ping %s -w %d"
Tool.conf.dfl_ping_times = 4


function Tool.Run()
	cgi.save.init()

	local _result = ''
	--if (user.verify.remote()) then
		local _get = cgi.data._get
		local _k = fmt.http.find('k', _get)

		if (_k == 'ping') then
			local _to = fmt.http.find('to', _get)
			local _times = fmt.http.find('times', _get) or 0
			_result = Tool.ops.ping(_to, _times)
		elseif (_k == 'flood') then
			local _to = fmt.http.find('to', _get) or ''
			local _times = fmt.http.find('times', _get)
			local _bw = fmt.http.find('bw', _get)
			_result = Tool.ops.flood(_to, _times, _bw)
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

		_result = string.format('{"error": null, "result": "ok", "prompt": "%s"}', _prompt)
	else
		_result = '{"error": "unknown target"}'
	end

	return _result
end


return Tool


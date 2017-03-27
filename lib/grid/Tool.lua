-- 6Harmonics Qige @ K2E 7S4
-- 2017.03.01

local FMT = require 'six.fmt'
local CMD = require 'six.cmd'

local USER = require 'grid.base.user'
local CGI = require 'grid.base.cgi'


local N = FMT.n
local SFmt = string.format
local FIND = FMT.http.find
local AUTH = USER.verify.Remote


Tool = {}


-- #define
Tool.conf = {}
Tool.conf.flood_cmd_fmt = "iperf -u -c %s -t %d -b %dM"
Tool.conf.dfl_flood_bw = 10
Tool.conf.dfl_flood_times = 10

Tool.conf.ping_cmd_fmt = "ping %s -w %d"
Tool.conf.dfl_ping_times = 4

-- for spectrum/channel scan, quiet mode
Tool.conf.chscan_file = '/tmp/.grid_cs_cache'
Tool.conf.chscan_cmd = 'sleep 1; /etc/init.d/grid-cs start'
Tool.conf.chscan_abord = '/etc/init.d/grid-cs stop'
Tool.conf.chscan_read_cmd_fmt = "touch %s; cat %s | grep ,%d, | awk -F ',' '{print $4}'"


Tool._remote = ''
Tool._get = ''
function Tool.init()
	CGI.Save()
	Tool._remote = CGI.raw._remote
	Tool._get = CGI.raw._get
end
function Tool.Run()
	local _result = ''

	Tool.init()

	local _remote = Tool._remote
	if (AUTH(_remote)) then
		local _get = Tool._get
		local _k = FIND('k', _get)
		--_k = 'scan'

		if (_k == 'ping') then
			local _to = FIND('to', _get)
			local _times = FIND('times', _get)
			_result = Tool.ops.ping(_to, _times)
		elseif (_k == 'flood') then
			local _to = FIND('to', _get)
			local _times = FIND('times', _get)
			local _bw = FIND('bw', _get)
			_result = Tool.ops.flood(_to, _times, _bw)
		elseif (_k == 'scan') then
			local _b = FIND('b', _get)
			local _e = FIND('e', _get)
			local _rgn = FIND('r', _get)
			_result = Tool.ops.scan(_rgn, _b, _e)
		elseif (_k == 'scan_abord') then
			_result = Tool.ops.scan_abord()
		elseif (_k == 'scan_read') then
			local _ch = FIND('ch', _get)
			_result = Tool.ops.scan_read(_ch)
		else
			_result = SFmt('unknown (%s)', _k or '[nil]')
		end
		CGI.job.Reply(_result)
	else
		CGI.json.Error('nobody');
	end
end



Tool.ops = {}

function Tool.ops.flood(_to, _times, _bw)
	local _target = _to or ''
	local _try = _times or Tool.conf.dfl_flood_times
	local _thrpt = _bw or Tool.conf.dfl_flood_bw
	local _msg = SFmt('flooding [%s] with [%d] Mbps for [%d] times', 
		_target, _thrpt, _try)

	if (_target and _target ~= '') then
		local _fmt = Tool.conf.flood_cmd_fmt
		local _cmd = SFmt(_fmt, _target, _try, _thrpt)
		CMD.exec(_cmd)

		_result = '{"error": null, "result": "ok"}'
	else
		_result = '{"error": "unknown target"}'
	end

	return _result
end

function Tool.ops.ping(_to, _times)
	local _target = _to or ''
	local _try = _times or 4
	local _msg = SFmt('ping [%s] for [%d] times', _target, _try)

	if (_target and _target ~= '') then
		local _fmt = Tool.conf.ping_cmd_fmt
		local _cmd = SFmt(_fmt, _target, _try)
		local _prompt = CMD.exec(_cmd)

		_result = SFmt('%s', _prompt)
	else
		_result = '{"error": "unknown target"}'
	end

	return _result
end

function Tool.ops.scan(_rgn, _b, _e)
	local _cmd = Tool.conf.chscan_abord .. ';' .. Tool.conf.chscan_cmd
	CMD.exec(_cmd)

	local _result = SFmt('{"error": null, "cmd":"%s", "result": "ok"}', _cmd)
	return _result
end

function Tool.ops.scan_abord()
	local _cmd = Tool.conf.chscan_abord
	CMD.exec(_cmd)

	local _result = '{"error": null, "cmd":"scan_abord", "result": "ok"}'
	return _result
end

function Tool.ops.scan_read(_ch)
	local _f = Tool.conf.chscan_file
	local _fmt = Tool.conf.chscan_read_cmd_fmt
	local _ch_ = FMT.n(_ch)
	if (_ch_ < 1) then
		_ch_ = 45
	end
	local _cmd = SFmt(_fmt, _f, _f, _ch_)
	local _noise = FMT.n(CMD.exec(_cmd)) or -88

	local _result_fmt = '{"error": null, "result": "ok", "data": { "ch": %d, "noise": %d }}'
	local _result = SFmt(_result_fmt, _ch_, _noise)
	--local _result = SFmt('f=%s;cmd=%s;ch=%d;noise=%d', _f, _cmd, _ch_, _noise)
	return _result
end

return Tool


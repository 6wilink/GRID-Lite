-- Reset ABB/Network/System
-- by Qige
-- 2016.04.05/2017.01.03/2017.03.24

local fmt = require 'six.fmt'
local cmd = require 'six.cmd'

local cgi = require 'grid.base.cgi'
local user = require 'grid.base.user'


local Reset = {}
Reset._remote = ''
Reset._get = ''
function Reset.init()
	cgi.Save()
	Reset._remote = cgi.raw._remote
	Reset._get = cgi.raw._get
end

function Reset.Run()
	local _result = ''

	Reset.init()

	local _remote = Reset._remote
	if (user.verify.Remote(_remote)) then
		local _get = Reset._get
		local _k = fmt.http.find('k', _get)
		--_k = 'abb'

		if (_k == 'gws') then
			_result = Reset.ops.gws()
		elseif (_k == 'nw') then
			_result = Reset.ops.nw()
		elseif (_k == 'abb') then
			_result = Reset.ops.abb()
		elseif (_k == 'sys') then
			_result = Reset.ops.sys()
		else
			_result = 'unknown ' .. _k
		end
		cgi.job.Reply(_result)
	else
		cgi.json.Error('nobody');
	end
end

function Reset.InitFactory()
	cgi.Save()
	cgi.job.Reply(Reset.ops.new())
end

-- #define
Reset.conf = {}
Reset.conf.path_ok = '/grid/app.html?k=realtime'
Reset.conf.path_error = '/grid/'
Reset.conf.path_exit = '/grid/'

Reset.cmd = {}
Reset.cmd.fmt_reply = '{"result":"%s", "cmd":"%s", "prompt": "%s"}'
Reset.cmd.abb = 'wifi'
Reset.cmd.nw = '/etc/init.d/network restart'
Reset.cmd.sys = 'reboot'
Reset.cmd.gws = 'gws5001app rfoff; gws5001app rfon'

Reset.cmd.new = 'uptime'

Reset.ops = {}

function Reset.ops.exec(_cmd)
	local _result = ''
	local _fmt = Reset.cmd.fmt_reply
	local _prompt = cmd.exec(_cmd)
	_result = string.format(_fmt, 'ok', _cmd, _prompt)
	return _result
end

function Reset.ops.new()
	return Reset.ops.exec(Reset.cmd.new)
end

function Reset.ops.gws()
	return Reset.ops.exec(Reset.cmd.gws)
end

function Reset.ops.nw()
	return Reset.ops.exec(Reset.cmd.nw)
end

function Reset.ops.abb()
	return Reset.ops.exec(Reset.cmd.abb)
end

function Reset.ops.sys()
	return Reset.ops.exec(Reset.cmd.sys)
end


return Reset


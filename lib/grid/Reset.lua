-- user login, check peer state, logout
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.16

require 'grid.base.cgi'
require 'grid.base.user'
require 'grid.base.fmt'
require 'grid.Http'

Reset = {}

function Reset.Run()
	cgi.save.init()

	local _result = ''
	if (user.verify.remote()) then
		local _get = cgi.data._get
		local _k = fmt.http.find('k', _get)

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
		Http.job.Reply(_result)
	else
		Http.data.Error('nobody');
	end
end

function Reset.InitFactory()
	cgi.save.init()
	Http.job.Reply(Reset.ops.new())
end

-- #define
Reset.conf = {}
Reset.conf.path_ok = '/grid/app.html?k=realtime'
Reset.conf.path_error = '/grid/'
Reset.conf.path_exit = '/grid/'

Reset.cmd = {}
Reset.cmd.fmt_reply = '{"result":"%s", "cmd":"%s"}'
Reset.cmd.abb = 'wifi'
Reset.cmd.nw = '/etc/init.d/network restart'
Reset.cmd.sys = 'reboot'
Reset.cmd.gws = 'gws5001app rfoff; gws5001app rfon'

Reset.cmd.new = 'uptime'

Reset.ops = {}

function Reset.ops.exec(_cmd)
	local _result = ''
	local fmt = Reset.cmd.fmt_reply
	cmd.exec(_cmd)
	_result = string.format(fmt, 'ok', _cmd)
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


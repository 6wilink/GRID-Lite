-- user login, check peer state, logout
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.16

require 'grid.base.cgi'
require 'grid.base.user'
require 'grid.base.fmt'
require 'grid.Http'

Set = {}

function Set.Run()
	cgi.save.init()

	local _result = ''
	if (user.verify.remote()) then
		local _get = cgi.data._get
		local _com = fmt.http.find('com', _get)
		local _item = fmt.http.find('item', _get)
		local _val = fmt.http.find('val', _get)

		if (_val and _val ~= '-') then
			if (_com == 'gws') then
				_result = Set.ops.gws(_item, _val)
			elseif (_com == 'nw') then
				_result = Set.ops.nw(_item, _val)
			elseif (_com == 'abb') then
				_result = Set.ops.abb(_item, _val)
			elseif (_com == 'sys') then
				_result = Set.ops.sys(_item, _val)
			else
				_result = string.format('unknown (%s/%s/%s)', _com, _item, _val)
			end
			Http.job.Reply(_result)
		else
			Http.job.Error('noparam');
		end
	else
		Http.data.Error('nobody');
	end
end


-- #define
Set.conf = {}
Set.conf.path_ok = '/grid/app.html?k=realtime'
Set.conf.path_error = '/grid/'
Set.conf.path_exit = '/grid/'

Set.cmd = {}
Set.cmd.fmt_reply = '{"result":"%s", "cmd":"%s"}'
Set.cmd.abb = {}
Set.cmd.abb.reset = 'wifi'
Set.cmd.abb.ssid = 'uci set wireless.@wifi-iface[0].ssid="%s"; uci commit wireless; wifi'

Set.cmd.nw = '/etc/init.d/network restart'
Set.cmd.sys = 'reboot'

Set.cmd.gws = {}
Set.cmd.gws.reset = '/etc/init.d/gws_radio restart'
Set.cmd.gws.rgn = 'uci set gws_radio.v1.region=%s; uci commit gws_radio'
Set.cmd.gws.rxg = 'uci set gws_radio.v1.rxgain=%s; uci commit gws_radio'
Set.cmd.gws.ch = 'uci set gws_radio.v1.channel=%s; uci commit gws_radio'


Set.ops = {}

function Set.ops.exec(_cmd, _reset)
	local _result = ''
	local fmt = Set.cmd.fmt_reply
	
	cmd.exec(_cmd)
	
	-- resetart service if needed
	if (_reset) then
		cmd.exec(_reset)
	end

	_result = string.format(fmt, 'ok', _cmd)
	return _result
end


function Set.ops.gws(_item, _val)
	local _fmt = ''
	if (_item == 'rxg') then
		_fmt = Set.cmd.gws.rxg
	elseif (_item == 'rgn') then
		_fmt = Set.cmd.gws.rgn
	elseif (_item == 'ch') then
		_fmt = Set.cmd.gws.ch
		--return Set.ops.exec(Set.cmd.gws.reset, '')
	end
	if (_fmt and _val) then
		local _cmd = string.format(_fmt, _val)
		return Set.ops.exec(_cmd, Set.cmd.gws.reset)
	else
		local _error = string.format("gws: %s=%s", _item, _val)
		return _error
	end
end

function Set.ops.nw(_item, _val)
	return _item .. _val
	--return Set.ops.exec(Set.cmd.nw)
end

function Set.ops.abb(_item, _val)
	if (_item == 'ssid') then
		Set.ops.exec(Set.cmd.abb.ssid, _val)
		return Set.ops.exec(Set.cmd.abb.reset, '')
	else
		return _item .. '=' .. _val
	end
end

function Set.ops.sys(_item, _val)
	return _item .. _val
	--return Set.ops.exec(Set.cmd.sys)
end


return Set


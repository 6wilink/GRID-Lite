-- user login, check peer state, logout
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.16

local FMT = require 'six.fmt'
local CMD = require 'six.cmd'
local GWS = require 'kpi.GWS'

local CGI = require 'grid.base.cgi'
local USER = require 'grid.base.user'


local N = FMT.n
local SFmt = string.format
local FIND = FMT.http.find
local AUTH = USER.verify.Remote


Set = {}
Set._remote = ''
Set._get = ''
function Set.init()
	CGI.Save()
	Set._remote = CGI.raw._remote
	Set._get = CGI.raw._get
end

function Set.Run()
	local _result = ''

	Set.init()

	local _remote = Set._remote
	local _get = Set._get
	if (AUTH(_remote)) then
		local _com = FIND('com', _get)
		local _item = FIND('item', _get)
		local _val = FIND('val', _get)

		--_com = 'gws'
		--_item = 'txpwr'
		--_val = '17'

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
				_result = SFmt('unknown (%s/%s/%s)', _com, _item, _val)
			end
			CGI.job.Reply(_result)
		else
			CGI.job.Error('noparam');
		end
	else
		CGI.json.Error('nobody');
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
--Set.cmd.gws.rgn = 'uci set gws_radio.v1.region=%s; uci commit gws_radio'
--Set.cmd.gws.rxg = 'uci set gws_radio.v1.rxgain=%s; uci commit gws_radio'
--Set.cmd.gws.ch = 'uci set gws_radio.v1.channel=%s; uci commit gws_radio'
Set.cmd.gws.rgn = 'setregion %s'
Set.cmd.gws.ch = 'setchan %s'
Set.cmd.gws.chbw = 'setchanbw %s'
Set.cmd.gws.txpwr = 'settxpwr %s'
Set.cmd.gws.rxagc = 'setrxagc %s'
Set.cmd.gws.rxg = 'setrxgain %s'


Set.ops = {}

function Set.ops.exec(_cmd, _reset)
	local _result = ''
	local fmt = Set.cmd.fmt_reply
	
	CMD.exec(_cmd)
	
	-- resetart service if needed
	if (_reset) then
		CMD.exec(_reset)
	end

	_result = SFmt(fmt, 'ok', _cmd)
	return _result
end


function Set.ops.gws(_item, _val)
	local _result
	local _cmd
	local _cmd_fmt
	if (_item == 'rxg') then
		_cmd_fmt = Set.cmd.gws.rxg
		_cmd = SFmt(_cmd_fmt, _val)
	elseif (_item == 'rgn') then
		_cmd_fmt = Set.cmd.gws.rgn
		_cmd = SFmt(_cmd_fmt, _val)
	elseif (_item == 'ch') then
		_cmd_fmt = Set.cmd.gws.ch
		_cmd = SFmt(_cmd_fmt, _val)
	elseif (_item == 'txpwr') then
		_cmd_fmt = Set.cmd.gws.txpwr
		_cmd = SFmt(_cmd_fmt, _val)
	elseif (_item == 'rxagc') then
		_cmd_fmt = Set.cmd.gws.rxagc
		if (_val == 'on') then
			_cmd = SFmt(_cmd_fmt, '1')
		else
			_cmd = SFmt(_cmd_fmt, '0')
		end
	end
	if (_cmd) then
		local _r = CMD.exec(_cmd)
		_result = SFmt('{"error": null, "cmd": "%s", "result": "%s"}', _cmd, _r)
	else
		local _error = SFmt("gws: %s=%s", _item, _val)
		_result = _error
	end
	return _result
end

function Set.ops.nw(_item, _val)
	return _item .. _val
	--return Set.ops.exec(Set.cmd.nw)
end

function Set.ops.abb(_item, _val)
	local _result
	local _cmd
	local _cmd_fmt

	if (_item == 'mode') then
		if (_val == '1') then
			_cmd = 'config_ear'
		elseif (_val == '2') then
			_cmd = 'config_car'
		elseif (_val == '0') then
			_cmd = 'config_mesh'
		end
	end

	if (_cmd) then
		local _r = CMD.exec(_cmd)
		_result = SFmt('{"error": null, "cmd": "%s", "result": "%s"}', _cmd, _r)
	else
		local _error = SFmt("abb: %s=%s", _item, _val)
		_result = _error
	end
	
	return _result
end

function Set.ops.sys(_item, _val)
	return _item .. _val
	--return Set.ops.exec(Set.cmd.sys)
end


return Set


-- GWS Controller
-- by Qige
-- 2017.02.23
-- 2017.03.04

require 'grid.base.conf'
require 'grid.base.cmd'
require 'grid.base.fmt'


GWS = {}

GWS.conf = {}
GWS.conf.file = conf.default.file
GWS.conf.platform = conf.uci.get(GWS.conf.file, 'v1', 'radio') or 'gws5k'


-- GWS3000
GWS.gws3k = {}
GWS.gws3k.get = {}
GWS.gws3k.get.rfinfo = 'rfinfo | grep [0-9\.\-] -o'
GWS.gws3k.get.note = ''

function GWS.gws3k.update()
	local _gws = {}
	
	_gws.rgn = -1
	_gws.ch = -1
	_gws.chbw = -1
	_gws.txpwr = -99
	_gws.rxg = -99
	_gws.tpc = -1
	_gws.agc = -1
	_gws.note = '30.00 degree'

	return _gws
end

-- GWS4000
GWS.gws4k = {}
GWS.gws4k.get = {}
GWS.gws4k.get.region = 'getregion'
GWS.gws4k.get.channel = 'getchan'
GWS.gws4k.get.chanbw = 'getchanbw'
GWS.gws4k.get.txpwr = 'gettxpwr | grep "^Tx" -m1 | grep [0-9\.\-]* -o'
GWS.gws4k.get.rxgain = ''
GWS.gws4k.get.tpc = 'ps | grep -v grep | grep tpc'
GWS.gws4k.get.agc = ''
GWS.gws4k.get.note = 'gettemp | tr -d "\n"'

function GWS.gws4k.update()
	local _gws = {}
	
	_gws.rgn = cmd.exec(GWS.gws4k.get.region) or -1
	_gws.ch = cmd.exec(GWS.gws4k.get.channel) or -1
	_gws.chbw = cmd.exec(GWS.gws4k.get.chanbw) or -1
	_gws.txpwr = cmd.exec(GWS.gws4k.get.txpwr) or -1
	_gws.rxg = -99
	_gws.tpc = -1
	_gws.agc = -1
	_gws.note = cmd.exec(GWS.gws4k.get.note) or ''

	return _gws
end



-- handle GWS3K/GWS4K set
GWS.gws34 = {}
GWS.gws34.set = {}
GWS.gws34.set.rxgain = 'setrxgain %s'
GWS.gws34.set.region = 'setregion %s'
GWS.gws34.set.channel = 'setchan %s'
GWS.gws34.set.txpwr = 'settxpwr %s'

function GWS.gws34.save(_item, _val)
	local _result
	local _fmt = ''
	if (_item == 'rxg') then
		_fmt = GWS.gws34.set.rxgain
	elseif (_item == 'rgn') then
		_fmt = GWS.gws34.set.region
	elseif (_item == 'ch') then
		_fmt = GWS.gws34.set.channel
	elseif (_item == 'txpwr') then
		_fmt = GWS.gws34.set.txpwr
	end
	if (_fmt and _val) then
		local _cmd = string.format(_fmt, _val)
		_result = cmd.exec(_cmd)
		_result = string.format('{"error": null, "cmd": "%s", "result": "%s"}', _cmd, _result or 'null')
	else
		local _error = string.format('{"error": "failed", "result": "gws34: %s=%s failed"}', _item, _val)
		_result = _error
	end

	--io.write(_result)
	return _result
end



-- handle GWS5K get
GWS.gws5k = {}
GWS.gws5k.get = {}
GWS.gws5k.get.rfinfo = 'gws > /tmp/.grid_cache_rfinfo'
GWS.gws5k.get.wait = 'sleep 1'
GWS.gws5k.get.region = 'cat /tmp/.grid_cache_rfinfo | grep Region -m1 | awk \'{print $2}\''
GWS.gws5k.get.channel = 'cat /tmp/.grid_cache_rfinfo | grep Chan -m1 | awk \'{print $2}\''
GWS.gws5k.get.txpwr = 'cat /tmp/.grid_cache_rfinfo | grep Power -m1 | awk \'{print $2}\''
GWS.gws5k.get.chbw = 'getchanbw | grep Radio | awk \'{print $2}\''
GWS.gws5k.get.agc = 'cat /tmp/.grid_cache_rfinfo | grep AGC | grep ON'
GWS.gws5k.get.rxgain = 'cat /tmp/.grid_cache_rfinfo | grep RxGain | awk \'{print $2}\''
GWS.gws5k.get.note = 'cat /tmp/.grid_cache_rfinfo'

function GWS.gws5k.update()
	local _gws = {}
	
	-- cat rfinfo into temp file
	cmd.exec(GWS.gws5k.get.rfinfo)

	--cmd.exec(GWS.gws5k.cmd.wait)

	_gws.rgn = cmd.exec(GWS.gws5k.get.region) or -1
	_gws.ch = cmd.exec(GWS.gws5k.get.channel) or -1
	_gws.chbw = cmd.exec(GWS.gws5k.get.chbw) or -1
	_gws.txpwr = cmd.exec(GWS.gws5k.get.txpwr) or -1
	_gws.rxg = cmd.exec(GWS.gws5k.get.rxgain) or -1
	_gws.tpc = -1

	local _agc = cmd.exec(GWS.gws5k.get.agc) or ''
	if (string.len(_agc) > 0) then
		_gws.agc = 1
	else
		_gws.agc = 0
	end
	_gws.note = '(gws5001)'

	return _gws
end


-- handle GWS5K set
GWS.gws5k.set = {}
GWS.gws5k.set.rxgain = 'gws -G %s'
GWS.gws5k.set.region = 'gws -R %s'
GWS.gws5k.set.channel = 'gws -C %s'
GWS.gws5k.set.txpwr = 'gws -P %s'

function GWS.gws5k.save(_item, _val)
	local _result
	local _fmt = ''
	if (_item == 'rxg') then
		_fmt = GWS.gws5k.set.rxgain
	elseif (_item == 'rgn') then
		_fmt = GWS.gws5k.set.region
	elseif (_item == 'ch') then
		_fmt = GWS.gws5k.set.channel
	elseif (_item == 'txpwr') then
		_fmt = GWS.gws5k.set.txpwr
	end
	if (_fmt and _val) then
		local _cmd = string.format(_fmt, _val)
		_result = cmd.exec(_cmd)
		_result = string.format('{"error": null, "cmd": "%s", "result": "%s"}', _cmd, _result or 'null')
	else
		local _error = string.format('{"error": "failed", "result": "gws5k: %s=%s failed"}', _item, _val)
		_result = _error
	end

	--io.write(_result)
	return _result
end



-- all functions that for external calling
GWS.ops = {}

-- to different cmds based on different platform
function GWS.ops.read()
	local _gws = {}
	
	local _platform = GWS.conf.platform

	if (_platform == 'gws3k') then
		_gws = GWS.gws3k.update()
	elseif (_platform == 'gws4k') then
		_gws = GWS.gws4k.update()
	--elseif (_platform == 'gws5k') then
	else
		_gws = GWS.gws5k.update()
	end

	return _gws
end

-- answer "GWS.ops.Update()" called by "grid/Get.lua"
-- eg. rgn/ch/bw/rxg/txpwr/tpc/agc/note
function GWS.ops.Update()
	local _result
	local _fmt = '{"rgn": %d, "ch": %d, "bw": %d, '
		.. '"txpwr": %d, "tpc": %d, "rxg": %d, "agc": %d, "note": "%s" }'

	local _gws = GWS.ops.read()
	_result = string.format(_fmt, _gws.rgn or -1, _gws.ch or -1, _gws.chbw or -1, 
		_gws.txpwr or 0, _gws.tpc or -1, _gws.rxg or 0, _gws.agc or -1, _gws.note or '')

	return _result
end

-- answer "GWS.ops.Set()" called by "grid/Set.lua"
-- eg. rgn/ch/chbw/txpwr/tpc/rxg/agc
function GWS.ops.Set(_item, _val)
	local _result
	
	local _platform = GWS.conf.platform
	if (_platform == 'gws3k' or _platform == 'gws4k') then
		_result = GWS.gws34.save(_item, _val)
	--elseif (_platform == 'gws5k') then
	else
		_result = GWS.gws5k.save(_item, _val)
	end
	return _result
end


return GWS
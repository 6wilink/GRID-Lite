-- abb Controller
-- by Qige
-- 2017.02.23

require "iwinfo"
require 'grid.base.fmt'


ABB = {}

ABB.cache = {}
ABB.cache.iw = nil
ABB.cache._abb = nil
ABB.cache._ts = nil


-- TODO: add chanbw, dev, api to .conf file
ABB.conf = {}
ABB.conf.chbw = 8
ABB.conf.dev = 'wlan0'
ABB.conf.api = 'nl80211'

-- limit min time interval
-- with 2s, return last cache
-- over 2s, read new
ABB.conf.intl = 2


ABB.ops = {}

-- init iw when first time use
function ABB.ops.init()
	if (ABB.cache.iw == nil) then
		local _dev = ABB.conf.dev or 'wlan0'
		local _api = ABB.conf.api or 'nl80211'
		ABB.cache.iw = iwinfo[_api]
	end
end

-- return ABB base information
function ABB.ops.Update()
	ABB.ops.init()
	local _abb

	local ts_gap_bar = ABB.conf.intl or 2
	local ts = os.time()
	local _ts = ABB.cache._ts or 0
	if (ts - _ts > ts_gap_bar) then
		_abb = ABB.ops.read()
	else
		_abb = ABB.cache._abb
	end
	return _abb
end


function ABB.ops.read()
	local _abb = {}

	local _dev = ABB.conf.dev or 'wlan0'
	local _iw = ABB.cache.iw
	local _bw = ABB.conf.chbw

	local enc = _iw.encryption(_dev)

	local bssid = _iw.bssid(_dev)
	local ssid = _iw.ssid(_dev)
	local mode = _iw.mode(_dev)
	local noise = fmt.n(_iw.noise(_dev))
	local signal = fmt.n(_iw.signal(_dev))
	local br = fmt.n(_iw.bitrate(_dev))/1024*(_bw/20) -- Mbit*(8/20)

	-- get & save
	_abb.bssid = bssid or '(unknown)'
	_abb.signal = signal or noise
	_abb.noise = noise or -101
	_abb.br = br or 0
	_abb.chbw = _bw
	_abb.mode =  ABB.ops.mode(mode)
	_abb.ssid = ssid or '(unknown)'
	_abb.encrypt = enc and enc.description or ''
	_abb.peers = 'null'

	ABB.cache._abb = _abb
	ABB.cache._ts = os.time()

	return _abb
end

function ABB.ops.mode(_mode)
	if (_mode == 'Master') then
		return 'CAR'
	elseif (_mode == 'Client') then
		return 'EAR'
	else
		return _mode
	end
end



ABB.get = {}


return ABB
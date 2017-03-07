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

function ABB.cache.mode()
	if (ABB.cache._abb) then
		return ABB.cache._abb.mode
	else
		return nil
	end
end


-- TODO: add chanbw, dev, api to .conf file
ABB.conf = {}
ABB.conf.chbw = 8
ABB.conf.dev = 'wlan0'
ABB.conf.api = 'nl80211'
ABB.conf.bar_inactive = 3000

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

	local _result
	local _data

	local ts_gap_bar = ABB.conf.intl or 2
	local ts = os.time()
	local _ts = ABB.cache._ts or 0
	if (ts - _ts > ts_gap_bar) then
		_data = ABB.ops.read()
	else
		_data = ABB.cache._abb
	end


	local _fmt = '{"bssid": "%s", "ssid": "%s", "mode": "%s", "encrypt": "%s", '
		.. '"signal": %d, "noise": %d, "peers": %s }'
	_result = string.format(_fmt, _data.bssid, _data.ssid, _data.mode, _data.encrypt, 
		_data.signal, _data.noise, _data.peers)

	return _result
end


function ABB.ops.read()
	local _abb = {}

	local _dev = ABB.conf.dev or 'wlan0'
	local _iw = ABB.cache.iw
	local _bw = ABB.conf.chbw

	local _mode = ABB.ops.mode(_iw.mode(_dev))

	local enc = _iw.encryption(_dev)

	local _mode = ABB.ops.mode(_iw.mode(_dev))

	local bssid, ssid
	if (_mode == 'Mesh Point') then
		-- fix issue#22
		bssid = cmd.exec('ifconfig wlan0 | grep wlan0 -m1 | awk \'{print $5}\' | tr -d "\n"')
		ssid = cmd.exec('uci get wireless.@wifi-iface[0].mesh_id > /tmp/.grid_meshid; cat /tmp/.grid_meshid | tr -d "\n"')
	else
		bssid = _iw.bssid(_dev)
		ssid = _iw.ssid(_dev)
	end
	local noise = fmt.n(_iw.noise(_dev))
	if (noise == 0) then
		noise = -101 -- gws4k noise=0
	end

	local signal = fmt.n(_iw.signal(_dev))
	-- fix issue#6
	if (signal == 0) then
		signal = noise
	end
	local br = fmt.n(_iw.bitrate(_dev))/1024*(_bw/20) -- Mbit*(8/20)

	-- get & save
	_abb.ssid = ssid or '(unknown ssid)'
	_abb.bssid = bssid or '(unknown bssid)'
	_abb.signal = signal or noise
	_abb.noise = noise
	_abb.chbw = _bw
	_abb.mode =  _mode
	_abb.encrypt = enc and enc.description or ''
	_abb.peers = ABB.ops.peers() or '{}'

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

-- foreach peer(s), save
function ABB.ops.peers()
	local _result = '['
	local _fmt = '{"mac": "%s", "ip": "%s", "signal": %d, "noise": %d, '
		.. '"tx_mcs": %d, "tx_br": %.1f, "tx_short_gi": %d, '
		.. '"rx_mcs": %d, "rx_br": %.1f, "rx_short_gi": %d, '
		.. '"inactive": %d }'

	local _dev = ABB.conf.dev or 'wlan0'
	local _iw = ABB.cache.iw


	-- 2017.03.06
	local al = _iw.assoclist(_dev)
	local noise = fmt.n(_iw.noise(_dev))
	if (noise == 0) then
		noise = -101 -- gws4k noise=0
	end


	local ai, ae
	if al and next(al) then
		for ai, ae in pairs(al) do
			local _peer = {}
			_peer.bssid = ae.bssid or 'unknown bssid'
			_peer.peer = fmt.s(ai) or 'unknown ssid'
			_peer.ip = ''
			
			_peer.signal = fmt.n(ae.signal)
			_peer.noise = noise
			
			_peer.txmcs = fmt.n(ae.tx_mcs) or -1
			_peer.txbr = fmt.n(ae.tx_rate)/1024*(8/20) or 0
			_peer.tx_short_gi = fmt.n(ae.tx_short_gi) or -1

			_peer.rxmcs = fmt.n(ae.rx_mcs) or -1
			_peer.rxbr = fmt.n(ae.rx_rate)/1024*(8/20) or 0
			_peer.rx_short_gi = fmt.n(ae.rx_short_gi) or -1

			_peer.inactive = fmt.n(ae.inactive) or -1

			if (_peer.inactive < ABB.conf.bar_inactive) then
				local _r = string.format(_fmt, _peer.peer, _peer.ip, _peer.signal, _peer.noise,
					_peer.txmcs, _peer.txbr, _peer.tx_short_gi,
					_peer.rxmcs, _peer.rxbr, _peer.rx_short_gi, 
					_peer.inactive)

				if (_result ~= '[') then
					_result = _result .. ','
				end
				_result = _result .. _r
			end
		end
	end

	_result = _result .. ']'
	return _result
end

ABB.get = {}


return ABB
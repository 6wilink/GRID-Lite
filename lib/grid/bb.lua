-- system strings
-- by Qige
-- 2017.01.06/2017.01.09/2017.01.16

require 'iwinfo'
require 'grid.base.fmt'


bb = {}

bb.conf = {}

function bb.init()
  bb.conf._dev = 'wlan0'
  bb.conf._api = iwinfo.type(bb.conf._dev)
end

function bb.update()
  local _data = {}
  
  local _dev1 = { peer = 'AB:CD:EF:00:01:03', remote = 'AB:CD:EF:00:01:04', signal = -75 + seed.random(0, 10), noise = -101, rx = '10.05 Mbps (4s)', tx = '10.05 Mbps (4s)', inactive = seed.random(0, 1024) }
  local _dev2 = { peer = 'AB:CD:EF:00:01:03', remote = 'AB:CD:EF:00:01:05', signal = -75 + seed.random(0, 10), noise = -101, rx = '10.05 Mbps (4s)', tx = '10.05 Mbps (4s)', inactive = seed.random(0, 1024) }
  
  bb.init()
  local _dev3 = bb.peer.update(bb.conf._api, bb.conf._dev)
  
  table.insert(_data, 1, _dev1)
  table.insert(_data, 1, _dev3)
  
  --return _data
  return bb.peer.update(bb.conf._api, bb.conf._dev)
end


bb.peer = {}
function bb.peer.update(api, dev)
  local _data = {}
  
  local iw = iwinfo[api]
  local al = iw.assoclist(dev)
  local ns = iw.noise(dev)
  
  local ai, ae
  if al and next(al) then
    for ai, ae in pairs(al) do
      local _peer = {}
      _peer.peer = fmt.s(ai)
      _peer.remote = ''
      _peer.signal = fmt.n(ae.signal)
      _peer.noise = fmt.n(ns)
      _peer.rx = ''
      _peer.tx = ''
      _peer.inactive = fmt.n(ae.inactive)
      
      table.insert(_data, _peer)
    end
  end
  
  return _data
end



return bb

-- system strings
-- by Qige
-- 2017.01.06/2017.01.09/2017.01.16

require 'grid.base.cmd'
require 'grid.base.seed'


nw = {}

nw.cmdTotal = 'ifconfig br-lan | grep bytes | grep :[0-9]* -o | grep [0-9]* -o | tr "\n" ","'

function nw.update()
  local _data = {}
  
  local _dev1 = { peer = 'AB:CD:EF:00:01:03', remote = 'AB:CD:EF:00:01:04', signal = -75 + seed.random(0, 10), noise = -101, rx = '10.05 Mbps (4s)', tx = '10.05 Mbps (4s)', inactive = seed.random(0, 1024) }
  local _dev2 = { peer = 'AB:CD:EF:00:01:03', remote = 'AB:CD:EF:00:01:05', signal = -75 + seed.random(0, 10), noise = -101, rx = '10.05 Mbps (4s)', tx = '10.05 Mbps (4s)', inactive = seed.random(0, 1024) }
  
  table.insert(_data, _dev1)
  table.insert(_data, _dev2)
  
  return _data
end

function nw.demo()
  local _total = seed.random(0, 26)
  local _lan = 0.384 * _total
  local _wlan = (1 - 0.384) * _total
  return { total = seed.random(0, 26), wan = 0, lan = _lan, wlan = _wlan }
end

return nw

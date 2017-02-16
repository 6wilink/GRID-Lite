-- kpi: gws/network/baseband/stas nw
-- by Qige
-- 2017.01.05/2017.01.16

require 'grid.base.cgi'
require 'grid.bb'
require 'grid.gws'
require 'grid.nw'


kpi = {}

function kpi.bb()
  return bb.update() 
end

function kpi.gws()
  return gws.update()  
end

function kpi.nw()
  local _data = nw.demo()
  return _data
end

function kpi.ts()
  return os.time()
end

function kpi.token()
  return seed.random(21, 60)
end

return kpi

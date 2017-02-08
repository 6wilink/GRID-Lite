-- AppData: 
-- @desc:   collect all data, saved in "lua.table"
-- by Qige
-- 2017.01.05/2017.01.06

require 'wui.base.file'
require 'wui.base.seed'
require 'wui.base.cmd'

require 'wui.basic'
require 'wui.kpi'


AppData = {}

AppData.sync = {}
function AppData.sync.basic()
  local _dataArray = basic.update()
  return _dataArray
end

function AppData.sync.kpi()
  local _dataArray = {}
  _dataArray['gws'] = kpi.gws()
  _dataArray['nw'] = kpi.nw()
  _dataArray['bb'] = kpi.bb()
  _dataArray['token'] = kpi.token()
  _dataArray['ts'] = kpi.ts()
  
  return _dataArray
end


AppData.user = {}
function AppData.user.fixup()
  file.copy('/usr/lib/lua/wui/wui.conf', '/etc/config/wui')
end
function AppData.user.reboot()
  cmd.exec('reboot')
end

function AppData.user.cmd(_cmd)
  local _data = _cmd .. ': ' .. tostring(os.time())--'rfinfo\nregion: 1\nchannel: 43\n'
  return _data
end

return AppData


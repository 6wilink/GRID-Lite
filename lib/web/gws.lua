-- gws ops
-- by Qige
-- 2017.01.06

gws = {}

function gws.update()
  local _rf = {}
  
  _rf.rgn = 1
  _rf.ch = 43
  _rf.tx = '30 dBm'
  _rf.rx = 'rxgain = 12'
  _rf.bw = 2.5
  _rf.mode = gws.mode2String(2)
  
  return _rf
end


function gws.mode2String(val)
  local _result = ''
  
  if (val == 0) then
    _result = 'Mesh Point (bridged)'
  elseif (val == 1) then
    _result = 'EAR (bridged, WDS STA)'
  elseif (val == 2) then
    _result = 'CAR (bridged, WDS AP)'
  else
    _result = '(unknown)'
  end
  
  return _result
end

return gws

-- by Qige
-- 2017.01.09


fmt = {}

-- http key=value pairs
-- @return string/nil
fmt.http = {}
function fmt.http.find(key, data)
  if (key and data) then
    local s1, s2, val = string.find(data, key.."=(%w*)")
    if (val) then
      return val
    end
  end
  return nil
end

-- string split()
-- @return table/nil
fmt.str = {}
function fmt.str.split(delim, str)
  local _result = nil
  if (delim and str) then
    _result = {}
    -- todo: split string with delim
  end
  return _result
end


function fmt.s(s)
  if (s == nil) then
    return "?"
  else
    return tostring(s)
  end
end

function fmt.n(x)
  if (x == nil) then
    return 0
  else
    return tonumber(x)
  end
end

return fmt
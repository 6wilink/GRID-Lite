-- by Qige
-- 2017.01.09


fmt = {}

-- http key=value pairs
-- @return string/nil
fmt.http = {}
function fmt.http.find(key, data)
  if (key and data) then
    local s1, s2, val = string.find(data, key.."=([%w\.]*)")
    if (val) then
      return val
    end
  end
  return nil
end

fmt.cli = {}
-- @from http://zhaiku.blog.51cto.com/2489043/1163077
function fmt.cli.parse(s, p)
  local rt= {}
    string.gsub(s, '[^'..p..']+', function(w) table.insert(rt, w) end )
  return rt
end

-- string split()
-- @return table/nil
fmt.str = {}
function fmt.str.split(delim, str)
  return nil
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
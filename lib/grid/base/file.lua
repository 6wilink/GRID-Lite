-- file read/write
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.04/2017.01.06


file = {}

function file.read(path)
	local text = ''
	local _file = io.open(path, "r")
	if (_file) then
		text = _file:read("*all")
		_file:close()
	end
	return text
end
function file.write(path, text)
  if (path and path ~= '' and text) then
    local _file = io.open(path, "w")
    _file:write(text)
    _file:close()
  end
end

function file.copy(src, des)
  local text = file.read(src);
  file.write(des, text);
end

return file

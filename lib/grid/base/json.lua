-- json encode/decode
-- by Qige
-- 2017.01.06

json = {}

function json.encode(_data)
  local _response = {}

  _response = json.table2string(_data)
  if (_response == nil or _response == '') then
    _response = {}
  end

  return _response
end

-- if 'key' is 'string', save 'key'
-- if 'string', return _data
-- if 'table', call again
function json.table2string(_data)
	local _string = ''

	-- if nil or '', return ''
	if (_data and _data ~= '') then
		local _str = ''
		if (type(_data) == 'string') then
			_string = json.concat(_string, _data)
		elseif (type(_data) == 'table') then
			local _prefix = ''
			local _tail = ''

			if (#_data > 1) then
				_prefix = '['
				_tail = ']'
			else
				_prefix = '{'
				_tail = '}'
			end

			_str = json.concat(_str, _prefix)
			local i = 1
			for k,v in pairs(_data) do
				local _s = ''

				if (i > 1) then
					_str = json.concat(_str, ',')
				end

				if (type(k) == 'string') then
					_str = json.concat(_str, string.format('"%s":', k))
				end

				if (type(v) == 'table') then
					_s = json.table2string(v)
				else
					_s = string.format('"%s"', v)
				end
				_str = json.concat(_str, _s)
				_s = ''
				i = i + 1
			end
			_str = json.concat(_str, _tail)
		end
		_string = json.concat(_string, _str)
		_str = ''
	end

	return _string
end

function json.concat(s1, s2)
  return table.concat({s1, s2})
end

return json
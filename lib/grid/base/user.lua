-- user ops
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.04/2017.01.06

local conf = require 'six.conf'
local file = require 'six.file'
local cmd = require 'six.cmd'
local cgi = require 'grid.base.cgi'

local user = {}

user.default = {}
user.default._session = '/tmp/.grid_remote'
user.default.conf = 'grid-lite'
user.default.username = 'root'
user.default.password = '6Harmonics'

user.conf = {}
function user.conf.session()
  local f = conf.file.get(user.default.conf, 'v1', 'id')
  if (f and f ~= '') then
    return f
  end
	return user.default._session
end

function user.conf.root()
	local ip = conf.file.get(user.default.conf, 'v1', 'root')
  if (ip and ip ~= '') then
    return ip
  end
	return ''
end

function user.conf.user()
	local _user = conf.file.get(user.default.conf, 'v1', 'user')
  if (_user and _user ~= '') then
    return _user
  end
  return user.default.username
end

function user.conf.passwd()
	local _passwd = conf.file.get(user.default.conf, 'v1', 'pass')
  if (_passwd and _passwd ~= '') then
    return _passwd
  end
  return user.default.password
end

user.data = {}
user.data._root = user.conf.root()
user.data._user = user.conf.user()
user.data._password = user.conf.passwd()
user.data._session = user.conf.session()


-- if user logged in, compare saved ip with peer ip
user.verify = {}
function user.verify.Remote(_remote)
  local _file = user.data._session
	local _ip = file.read(_file)
	if (_ip and _remote) then
		return (_remote == _ip)
	end
  --return true -- TODO: DEBUG USE ONLY
	return false
end

function user.verify.Login(_user, _password)
	if (_user and _password and _user == user.data._user and _password == user.data._password) then
    return true
  end
  return false
end

user.ops = {}
function user.ops.Save(_remote)
  local _file = user.data._session
  file.write(_file, _remote)
end
function user.ops.Logout()
  local _file = user.data._session
  file.write(_file, '\n')
end

return user


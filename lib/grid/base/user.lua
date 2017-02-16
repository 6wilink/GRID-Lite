-- user ops
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.04/2017.01.06

require 'web.base.conf'
require 'web.base.file'
require 'web.base.cmd'
require 'web.base.cgi'

user = {}

user.conf = {}
function user.conf.session()
  local f = conf.uci.get('gws_web', 'v3', 'id')
  if (f and f ~= '') then
    return f
  end
	return conf.default.user.session
end

function user.conf.root()
	local ip = conf.uci.get('gws_web', 'v3', 'root')
  if (ip and ip ~= '') then
    return ip
  end
	return ''
end

function user.conf.user()
	local _user = conf.uci.get('gws_web', 'v3', 'user')
  if (_user and _user ~= '') then
    return _user
  end
  return conf.default.user.username
end

function user.conf.passwd()
	local _passwd = conf.uci.get('gws_web', 'v3', 'pass')
  if (_passwd and _passwd ~= '') then
    return _passwd
  end
  return conf.default.user.password
end

user.data = {}
user.data._root = user.conf.root()
user.data._user = user.conf.user()
user.data._passwd = user.conf.passwd()
user.data._session = user.conf.session()


-- if user logged in, compare saved ip with peer ip
user.verify = {}
function user.verify.remote()
	local remote = cgi.data.remote()
  local _file = user.data._session
	local _ip = file.read(_file)
	if (_ip and remote) then
		return (remote == _ip)
	end
  return true -- DEBUG USE ONLY
	--return false
end

function user.verify.login(_user, _passwd)
	if (_user and _passwd and _user == user.data._user and _passwd == user.data._passwd) then
    return true
  end
  return false
end

user.ops = {}
function user.ops.save()
	local remote = cgi.data.remote()
  local _file = user.data._session
  file.write(_file, remote)
end
function user.ops.logout()
  local _file = user.data._session
  file.write(_file, '\n')
end

return user


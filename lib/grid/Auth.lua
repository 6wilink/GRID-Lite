-- user login, check peer state, logout
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.16

local fmt = require 'six.fmt'
local file = require 'six.file'

local cgi = require 'grid.base.cgi'
local user = require 'grid.base.user'


local Auth = {}

function Auth.Login()
	cgi.Save()
	Auth.verify.init()
	cgi.job.Redirect(Auth.nobody.login())
end

function Auth.Status()
	Auth.verify.init()
	return Auth.verify.remote()
end

function Auth.Https()
	cgi.Save()
	Auth.verify.init()
	cgi.job.Reply(Auth.nobody.https())
end

function Auth.Logout()
	file.write('/tmp/.auth-start', os.time())
	cgi.Save()
	file.write('/tmp/.auth-stop', os.time())
	Auth.verify.init()
	cgi.job.Redirect(Auth.user.logout())
end


-- #define
Auth.conf = {}
Auth.conf.path_ok = '/grid/app.html?k=realtime'
Auth.conf.path_error = '/grid/'
Auth.conf.path_exit = '/grid/'

-- verified @ 2017.01.06 17:09
Auth.verify = {}
Auth.verify._remote = ''
Auth.verify._user = ''
Auth.verify._password = ''

function Auth.verify.init()
	local _remote = cgi.raw._remote or ''
	local _get = cgi.raw._get or ''
	local _post = cgi.raw._post or ''

	Auth.verify._remote = _remote
	Auth.verify._user = fmt.http.find('username', _post)
	Auth.verify._password = fmt.http.find('password', _post)
end
function Auth.verify.remote()
	local _remote = Auth.verify._remote
 	if (user.verify.Remote(_remote)) then
  		return true, 'valid remote'
  	else
  		return false, 'invalid remote'
	end
end

function Auth.verify.all()
	local reason = ''
	local _remote = Auth.verify._remote

	-- check ip first, then check user/passwd
	if (user.verify.Remote(_remote)) then
		user.ops.Save(_remote)
		reason = 'valid ip'
		return true, reason
	else
    	local _user = Auth.verify._user
    	local _password = Auth.verify._password
		if (user.verify.Login(_user, _password)) then
			user.ops.Save(_remote)
			reason = 'valid user and password'
			return true, reason
		else
			reason = 'invalid user or password'
			--[[reason = string.format('invalid user or password (%s/%s/%s, %s/%s/%s)',
				user.data._session, user.data._user, user.data._password,
				_remote or '-', _user or '-', _password or '-')]]--
		end
	end

	return false, reason
end

-- check user & redirect
Auth.nobody = {}
function Auth.nobody.login()
  	local _result, _target, _delay
	local flag, reason = Auth.verify.all()
	if (flag) then
		_result = 'Welcome. Thank you.'
		_target = Auth.conf.path_ok
		_delay = 1
	else
		_result = 'Login failed: ' .. reason
		_target = Auth.conf.path_error
		_delay = 3
	end
  	return _result, _target, _delay
end

function Auth.nobody.https()
	local _result
	local referer = os.getenv("HTTP_REFERER")
	if (string.find(referer, 'https')) then
		_result = '{"error": null, "result": "ok"}'
	else
		_result = '{"error": "https required", "result": "error"}'
	end
	return _result
end

-- User ops
Auth.user = {}
function Auth.user.logout()
  	local _result, _target, _delay
  	local flag, reason = Auth.verify.remote()
  	if (flag) then
  		user.ops.Logout()
  		_result = 'Thank you. Have a nice day.'
  		_target = Auth.conf.path_exit
  		_delay = 3
  	else
  		_result = 'Sorry. You need to login first'
  		_target = Auth.conf.path_error
  		_delay = 3
  	end
  	return _result, _target, _delay
end

return Auth


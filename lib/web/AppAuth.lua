-- user login, check peer state, logout
-- by Qige
-- 2016.04.05/2017.01.03

require 'wui.base.cgi'
require 'wui.base.user'

AppAuth = {}


-- verified @ 2017.01.06 17:09
AppAuth.verify = {}
function AppAuth.verify.remote()
  return user.verify.remote()
end

function AppAuth.verify.all()
	local reason = ''

	-- check ip first, then check user/passwd
	if (user.verify.remote()) then
		user.user.save()
		reason = 'valid ip'
		return true, reason
	else
    local _post = cgi._post
    local _user = fmt.http.find('username', _post)
    local _passwd = fmt.http.find('password', _post)
		if (user.verify.login(_user, _passwd)) then
			user.ops.save()
			reason = 'valid user and password'
			return true, reason
		else
			reason = 'invalid user or password'
		end
	end

	return false, reason
end

-- check user & redirect
AppAuth.nobody = {}
function AppAuth.nobody.login()
  local _result, _target, _delay
	local flag, reason = AppAuth.verify.all()
	if (flag) then
		_result = 'Welcome. Thank you.'
    _target = '/wui/status.html?k=realtime'
    _delay = 1
	else
    _result = 'Login failed: ' .. reason
    _target = '/wui/'
    _delay = 3
	end
  return _result, _target, _delay
end


-- User ops
AppAuth.user = {}
function AppAuth.user.logout()
  user.ops.logout()
end

return AppAuth


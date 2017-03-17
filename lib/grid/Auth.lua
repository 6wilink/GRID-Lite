-- user login, check peer state, logout
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.16

require 'grid.base.cgi'
require 'grid.base.user'
require 'grid.base.fmt'
require 'grid.Http'

Auth = {}

function Auth.Login()
	cgi.save.init()
	Http.job.Redirect(Auth.nobody.login())
end

function Auth.Status()
	return Auth.verify.remote()
end

function Auth.Https()
	cgi.save.init()
	Http.job.Reply(Auth.nobody.https())
end

function Auth.Logout()
	cgi.save.init()
	Http.job.Redirect(Auth.user.logout())
end


-- #define
Auth.conf = {}
Auth.conf.path_ok = '/grid/app.html?k=realtime'
Auth.conf.path_error = '/grid/'
Auth.conf.path_exit = '/grid/'

-- verified @ 2017.01.06 17:09
Auth.verify = {}
function Auth.verify.remote()
 	if (user.verify.remote()) then
  		--return true, 'valid remote'
  		return true, '已验证主机'
  	else
  		--return false, 'invalid remote'
  		return false, '未验证主机'
	end
end

function Auth.verify.all()
	local reason = ''

	-- check ip first, then check user/passwd
	if (user.verify.remote()) then
		user.ops.save()
		reason = 'valid ip'
		return true, reason
	else
    	local _post = cgi._post
    	local _user = fmt.http.find('username', _post)
    	local _passwd = fmt.http.find('password', _post)
		if (user.verify.login(_user, _passwd)) then
			user.ops.save()
			--reason = 'valid user and password'
			reason = '无效用户名和密码'
			return true, reason
		else
			--reason = 'invalid user or password'
			reason = '无效用户名或密码'
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
		--_result = 'Welcome. Thank you.'
		_result = '感谢您的使用。'
		_target = Auth.conf.path_ok
		_delay = 1
	else
		--_result = 'Login failed: ' .. reason
		_result = '验证身份失败。原因为：' .. reason
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
  		user.ops.logout()
  		--_result = 'Thank you. Have a nice day.'
  		_result = '谢谢，祝您好运。'
  		_target = Auth.conf.path_exit
  		_delay = 3
  	else
  		--_result = 'Sorry. You need to login first'
  		_result = '抱歉，请先验证身份。'
  		_target = Auth.conf.path_error
  		_delay = 3
  	end
  	return _result, _target, _delay
end

return Auth


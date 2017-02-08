-- Lua Fast-CGI Application

-- all function to each module
-- if First letter is Upper case, like cgi.Reply()
-- means this function will reply bytes to http(s) request

-- by Qige
-- 2017.01.03
-- 2017.01.09 
-- > re-write App.job.Redirect(), App.job.Reply()
-- > App.job, App.error, App.user, App.nobody

require 'wui.AppAuth'
require 'wui.AppData'
require 'wui.base.cgi'
require 'wui.base.fmt'
require 'wui.base.json'


App = {}


-- Reply()/Redirect()
App.job = {}

-- handle "ajax"
function App.job.Reply(_data)
  _response = json.encode(_data)
  if (_response) then
    cgi.out.Reply(_response)
  end
end

-- handle "redirect"
function App.job.Redirect(msg, target, delay)
  cgi.out.Goto(msg, target, delay);
end


-- error: need login, unknown method
App.error = {}

function App.error.Nobody()
	local _data = {["error"] = "identify yourself"}
  App.job.Reply(_data)
end

function App.error.Unknown()
  local _data = {["error"] = "unknown method" }
  App.job.Reply(_data)
end


App.user = {}
-- all authorized data response
function App.user.KPI()
  local _data = AppData.sync.kpi()
  App.job.Reply(_data)
end
function App.user.Basic()
  local _data = AppData.sync.basic()
  App.job.Reply(_data)
end
function App.user.ExecCmd()
  local _post = cgi.data._post
  local _cmd = fmt.http.find('cmd', _post)
  cgi.out.Reply(AppData.user.cmd(_cmd))
end

function App.user.Fixup()
  AppData.job.fixup()
  App.job.Redirect('Repairing ... (Please wait)', '/wui/', 3)
end
function App.user.Reboot()
  AppData.user.reboot()
  App.job.Redirect('Rebooting ... (Please wait)', '/wui/', 45)
end

function App.user.Logout()
  AppAuth.user.logout()
  App.job.Redirect('Logout Successfully (realtime)', '/wui/', 3)
end

-- all un-authorized response
App.nobody = {}
function App.nobody.Login()
  App.job.Redirect(AppAuth.nobody.login())
end
function App.nobody.Logout()
  App.job.Redirect('Logout Successfully (nobody)', '/wui/', 3)
end



-- analyze request
-- login/logout
-- basic/kpi/cmd/fixup/reboot/logout
function App.Run(_dbgKey)
  -- operation result data
  local _data = nil

	-- init cgi environment: remote/user/password
	cgi.save.init()

  -- _get: $_GET
  -- _k: key
  local _get, _k
	_get = cgi.data._get
	_k = fmt.http.find('k', _get)

  -- check DEBUG key
  if (_dbgKey and _dbgKey ~= '') then
    _k = _dbgKey
  end
  
  -- decide operations
	if (_k) then
    -- if valid user
    -- * read basic
    -- * read kpi
    -- * do fixup
    -- * do reboot
    -- * do logout
    if (AppAuth.verify.remote()) then
      if (_k == 'kpi') then
        App.user.KPI()
      elseif (_k == 'basic') then
        App.user.Basic()
      elseif (_k == 'cmd') then
        App.user.ExecCmd()
      elseif (_k == 'fixup') then
        App.user.Fixup()
      elseif (_k == 'reboot') then
        App.user.Reboot()
      elseif (_k == 'logout' or _k == 'login') then
        App.user.Logout() -- verified @ 2017.01.0-
      else
        App.error.Unknown()
      end
    
    -- if unknow user
    -- * logout (demo)
    -- * login
    elseif (_k == 'logout') then
      App.nobody.Logout()
    elseif (_k == 'login') then
      App.nobody.Login() -- verified @ 2017.01.0-
    else
      App.error.Nobody()
    end    
	else
		App.error.Unknown()
	end
end



-- DEBUG USE ONLY
-- will not verify user/remote
function App.Debug()
  --App.Run('')
  --App.Run('not-the-right-param')
  
  --App.Run('login')
  --App.Run('logout')
  
  -- Ops below, need to change "user.verifyRemote()"
  -- let it always return true
  -- 'cause cli don't have any cgi params
  
  --App.Run('basic')
  App.Run('kpi')
  
  --App.Run('fixup')
  --App.Run('reboot')

  --App.Run('cmd')
end

return App


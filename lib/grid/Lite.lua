-- Lua Fast-CGI Application

-- all function to each module
-- if First letter is Upper case, like cgi.Reply()
-- means this function will reply bytes to http(s) request

-- by Qige
-- 2017.01.03
-- 2017.01.09 
-- > re-write Lite.job.Redirect(), Lite.job.Reply()
-- > Lite.job, Lite.error, Lite.user, Lite.nobody

-- 2017.01.16
-- > replace "App" with "Lite"

require 'grid.AppAuth'
require 'grid.AppData'
require 'grid.base.cgi'
require 'grid.base.fmt'
require 'grid.base.json'


Lite = {}


-- Reply()/Redirect()
Lite.job = {}

-- handle "ajax"
function Lite.job.Reply(_data)
  _response = json.encode(_data)
  if (_response) then
    cgi.out.Reply(_response)
  end
end

-- handle "redirect"
function Lite.job.Redirect(msg, target, delay)
  cgi.out.Goto(msg, target, delay);
end


-- error: need login, unknown method
Lite.error = {}

function Lite.error.Nobody()
	local _data = {["error"] = "identify yourself"}
  Lite.job.Reply(_data)
end

function Lite.error.Unknown()
  local _data = {["error"] = "unknown method" }
  Lite.job.Reply(_data)
end


Lite.user = {}
-- all authorized data response
function Lite.user.KPI()
  local _data = AppData.sync.kpi()
  Lite.job.Reply(_data)
end
function Lite.user.Basic()
  local _data = AppData.sync.basic()
  Lite.job.Reply(_data)
end
function Lite.user.ExecCmd()
  local _post = cgi.data._post
  local _cmd = fmt.http.find('cmd', _post)
  cgi.out.Reply(AppData.user.cmd(_cmd))
end

function Lite.user.Fixup()
  AppData.job.fixup()
  Lite.job.Redirect('Repairing ... (Please wait)', '/wui/', 3)
end
function Lite.user.Reboot()
  AppData.user.reboot()
  Lite.job.Redirect('Rebooting ... (Please wait)', '/wui/', 45)
end

function Lite.user.Logout()
  AppAuth.user.logout()
  Lite.job.Redirect('Logout Successfully (realtime)', '/wui/', 3)
end

-- all un-authorized response
Lite.nobody = {}
function Lite.nobody.Login()
  Lite.job.Redirect(AppAuth.nobody.login())
end
function Lite.nobody.Logout()
  Lite.job.Redirect('Logout Successfully (nobody)', '/wui/', 3)
end



-- analyze request
-- login/logout
-- basic/kpi/cmd/fixup/reboot/logout
function Lite.Run(_dbgKey)
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
        Lite.user.KPI()
      elseif (_k == 'basic') then
        Lite.user.Basic()
      elseif (_k == 'cmd') then
        Lite.user.ExecCmd()
      elseif (_k == 'fixup') then
        Lite.user.Fixup()
      elseif (_k == 'reboot') then
        Lite.user.Reboot()
      elseif (_k == 'logout' or _k == 'login') then
        Lite.user.Logout() -- verified @ 2017.01.0-
      else
        Lite.error.Unknown()
      end
    
    -- if unknow user
    -- * logout (demo)
    -- * login
    elseif (_k == 'logout') then
      Lite.nobody.Logout()
    elseif (_k == 'login') then
      Lite.nobody.Login() -- verified @ 2017.01.0-
    else
      Lite.error.Nobody()
    end    
	else
		Lite.error.Unknown()
	end
end



-- DEBUG USE ONLY
-- will not verify user/remote
function Lite.Debug()
  --Lite.Run('')
  --Lite.Run('not-the-right-param')
  
  --Lite.Run('login')
  --Lite.Run('logout')
  
  -- Ops below, need to change "user.verifyRemote()"
  -- let it always return true
  -- 'cause cli don't have any cgi params
  
  --Lite.Run('basic')
  Lite.Run('kpi')
  
  --Lite.Run('fixup')
  --Lite.Run('reboot')

  --Lite.Run('cmd')
end

return Lite


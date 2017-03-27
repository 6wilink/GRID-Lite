-- cgi module
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.06

local conf = require 'six.conf'
local fmt = require 'six.fmt'
--local file = require 'six.file'
local html = require 'grid.base.html'

local cgi = {}

cgi.raw = {}
cgi.raw._remote = nil
cgi.raw._post = nil
cgi.raw._get = nil
cgi.raw._ts = nil


cgi.data = {}
function cgi.data.remote()
	return os.getenv("REMOTE_ADDR")
end
function cgi.data.post()
	local bytes2read = cgi.data._length()
	if (bytes2read > 0) then
		cgi.raw._post = io.read("*a")
	end
	if (cgi.raw._post) then
		return cgi.raw._post
	end
	return nil
end
function cgi.data.get()
	local data = os.getenv("QUERY_STRING")
	if (data and string.len(data) <= conf.limit.userinput.length) then
	--if (data) then
		cgi.raw._get = data
		return cgi.raw._get
	end
	return nil
end
function cgi.data.ts()
  return tostring(os.time())
end
function cgi.data._length()
	local _user = fmt.n(os.getenv("CONTENT_LENGTH"))
	local _limit = fmt.n(conf.limit.userinput.length)

	local _b2read = math.min(_user, _limit)
	if (_b2read > 0) then
		return _b2read
	end
	return 0
end


function cgi.Save()
	cgi.raw._remote = nil
	cgi.raw._post = nil
	cgi.raw._get = nil
	cgi.raw._ts = nil

	cgi.raw._remote = cgi.data.remote() or ''
	cgi.raw._post = cgi.data.post() or ''
	cgi.raw._get = cgi.data.get() or ''
	cgi.raw._ts = cgi.data.ts() or 0
end

cgi.out = {}
function cgi.out.Reply(text)
	io.write("Content-type: text/html\n\n")
	if (text) then
		io.write(text .. '\n')
	end
end

function cgi.out.Echo(text)
  if (text) then
    io.write(text)
  end
end

function cgi.out.Goto(text, url, delay)
	local html = html.goto(url, delay, text)
	if (html) then
		cgi.out.Reply(html)
	else
		cgi.out.Yell()
	end
end

function cgi.out.Yell(msg)
  cgi.out.Reply(string.format('500: server internal error (%s)', msg or '*unknown*'))
end


-- echo html
-- echo redirect html
cgi.job = {}

function cgi.job.Reply(_data)
	cgi.out.Reply(_data)
end

function cgi.job.Redirect(msg, target, delay)
	cgi.out.Goto(msg, target, delay);
end


-- echo errors in json format
cgi.json = {}

function cgi.json.Error(errno)
	local _result
	if (errno == 'nobody') then
		_result = '{"error": "unknown user"}'
	elseif (errno == 'noparam') then
		_result = '{"error": "invalid param"}'
	else
		_result = string.format('{"error": "unknown > %s"}', errno)
	end
	cgi.job.Reply(_result)
end


return cgi


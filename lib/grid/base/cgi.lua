-- cgi module
-- by Qige
-- 2016.04.05/2017.01.03/2017.01.06

require 'grid.base.conf'
require 'grid.base.html'

cgi = {}

cgi.data = {}
cgi.data._post = nil
cgi.data._get = nil
function cgi.data.remote()
	return os.getenv("REMOTE_ADDR")
end
function cgi.data.ts()
  return tostring(os.time())
end


cgi.save = {}
function cgi.save.init()
	cgi.data._post = nil
	cgi.data._get = nil
	cgi.data._post = cgi.save.post()
	cgi.data._get = cgi.save.get()
end
function cgi.save.post()
	local bytes2read = tonumber(os.getenv("CONTENT_LENGTH"))
	if (bytes2read and bytes2read <= tonumber(conf.limit.userDataLength)) then
		cgi._post = io.read("*all")
		if (cgi._post) then
			return cgi._post
		end
	end
	return nil
end
function cgi.save.get()
	local data = os.getenv("QUERY_STRING")
	if (data and string.len(data) <= conf.limit.userDataLength) then
	--if (data) then
		cgi._get = data
		return cgi._get
	end
	return nil
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


return cgi


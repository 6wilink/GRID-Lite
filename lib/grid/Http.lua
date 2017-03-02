-- Handler HTTP response
-- by Qige @ 2017.02.23


Http = {}

Http.job = {}

function Http.job.Reply(_data)
	cgi.out.Reply(_data)
end

function Http.job.Redirect(msg, target, delay)
	cgi.out.Goto(msg, target, delay);
end


Http.data = {}

function Http.data.Error(errno)
	local _result
	if (errno == 'nobody') then
		_result = '{"error": "unknown user"}'
	elseif (errno == 'noparam') then
		_result = '{"error": "invalid param"}'
	else
		_result = string.format('{"error": "unknown > %s"}', errno)
	end
	Http.job.Reply(_result)
end

return Http
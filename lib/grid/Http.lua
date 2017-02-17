
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
	if (errno == 'nobody') then
		Http.job.Reply('{"error": "unknown user"}')
	elseif (errno == 'noparam') then
		Http.job.Reply('{"erro": "invalid param"}')
	else
		Http.job.Reply('{"error": "unknown"}')
	end
end

return Http
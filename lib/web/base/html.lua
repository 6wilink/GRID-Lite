-- html module
-- by Qige
-- 2016.04.05/2017.01.03

html = {}

function html.head(text)
	return "<head>\n"..text.."\n</head>\n"
end

function html.body(text)
	return "<body>\n"..text.."\n</body>"
end

function html.html(text)
	return "<html>\n"..text.."\n</html>\n"
end

function html.goto(url, delay, text)
	local meta = "<meta http-equiv=\"refresh\" content=\""..delay.."; url="..url.."\" />"
	local head = html.head(meta)
	local body = html.body(text)
	local html = html.html(head..body)
	return html
end

return html

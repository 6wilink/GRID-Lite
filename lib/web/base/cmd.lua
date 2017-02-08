-- by Qige
-- 2016.04.05/2017.01.03

cmd = {}

function cmd.exec(cmd)
	local sys = io.popen(cmd)
	local result = sys:read("*all")

	io.close(sys)
	return result
end

return cmd

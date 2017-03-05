-- default values
-- by Qige
-- 2016.04.05/2017.01.03
-- 2017.01.09

require 'uci'

conf = {}

conf.default = {}
conf.default.user = {}
conf.default.file = 'grid-lite'
conf.default.user.session = '/tmp/.grid_safe_remote'
conf.default.user.username = 'root'
conf.default.user.password = '6Harmonics'
--conf.default.user.remote = '192.168.1.1'

conf.limit = {}
conf.limit.userDataLength = 128

conf.reg = {}
conf.reg.kv1 = "(%w+)%s*:%s*(%w+)"
conf.reg.kv2 = "(%w+)%s*:%s*(%d+)"
conf.reg.kv3 = "(%w+)%s*=%s*(%w+)"

conf.uci = {}
function conf.uci.get(conf, sec, opt)
	local x = uci.cursor()
	return x:get(conf, sec, opt)
end
function conf.uci.all(conf, sec)
	local x = uci.cursor()
	return x:get_all(conf, sec)
end

return conf


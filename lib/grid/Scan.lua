-- add "spectrum scan", replace package "gws5k_chscan"
-- by Qige @ 2017.03.22

require 'grid.base.cmd'
require 'grid.ABB'
require 'grid.GWS'

SScan = {}

SScan.conf = {}
SScan.conf.r0ch_min = 14
SScan.conf.r0ch_max = 51
SScan.conf.r1ch_min = 21
SScan.conf.r1ch_max = 51

SScan.conf._trigger = '/sys/kernel/debug/ieee80211/phy0/ath9k/chanscan'
SScan.conf._start = 'echo "scan enable" > %s; gws5001app setrxagc 0; sleep 1; gws5001app setrxgain 0\n'
SScan.conf._stop = 'echo "scan disable" > %s; sleep 1; gws5001app setrxagc 1\n'

SScan.conf._result = '/tmp/.grid_lite_chscan'
SScan.conf._clean = 'echo -n "" > %s\n'
SScan.conf._scan = 'gws -C %d; sleep 2\n'
SScan.conf._save = 'echo %d,%d,%d,%d,%d >> %s\n'

SScan.current = {}
SScan.current.rgn = -1
SScan.current.ch = -1
SScan.current.agc = -1

function SScan.load()
    local abb = ABB.ops.Read()
    local gws = GWS.ops.Read()
    if (gws and gws.rgn ~= nil) then
        SScan.current.rgn = gws.rgn
        SScan.current.ch = gws.ch
        SScan.current.agc = gws.agc
    end
end

function SScan.restore()
    local current = SScan.current
    if (current.rgn > -1) then
        if (current.rgn > 0) then
            GWS.ops.Set('rgn', 1)
        else
            GWS.ops.Set('rgn', 0)
        end
    end
    if (current.agc > -1) then
        if (current.rgn > 0) then
            GWS.ops.Set('agc', 1)
        else
            GWS.ops.Set('agc', 0)
        end
    end
    if (current.ch >= SScan.conf.r0ch_min) then
        GWS.ops.Set('ch', current.ch)
    end
end


function SScan.init()
    local _fmt = SScan.conf._start
    local _f = SScan.conf._trigger
    local _cmd = string.format(_fmt, _f)
    cmd.exec(_cmd)

    -- clean result cache
    _f = SScan.conf._result
    _fmt = SScan.conf._clean
    _cmd = string.format(_fmt, _f)
    cmd.exec(_cmd)
end

function SScan.stop()
    local _fmt = SScan.conf._stop
    local _f = SScan.conf._trigger
    local _cmd = string.format(_fmt, _f)
    cmd.exec(_cmd)
end

function SScan.Run(rgn, b, e)
    local _f = SScan.conf._result

    SScan.load()
    SScan.init()

    -- read noise after 1 second
    -- set next channel
    local _rgn = rgn or 0
    local _ch = b or SScan.conf.r0ch_min
    local _freq
    local _noise = -111
    local _cmd
    local _fmt_scan = SScan.conf._scan
    local _fmt_save = SScan.conf._save
    local _ts, i
    
    for i = _ch, e do
        if (_rgn > 0) then
            _freq = 474+8*(i-21)
        else
            _freq = 473+6*(i-14)
        end
        _noise = ABB.ops.Noise()
        _ts = os.time()

        _cmd = string.format(_fmt_scan, i)
        cmd.exec(_cmd)
        
        _cmd = string.format(_fmt_save, _rgn, i, _freq, _noise, _ts, _f)
        cmd.exec(_cmd)
    end

    SScan.stop()
    --SScan.restore()
end

return SSCan
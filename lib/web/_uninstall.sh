#!/bin/sh

echo 'Removing Package "gws_web" ...'

rm /www/cgi-bin/data
rm -rf /usr/lib/lua/web
rm /etc/config/gws_web
rm -rf /www/gws

echo ' done.'
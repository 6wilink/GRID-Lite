#!/bin/sh

echo 'Removing Package "grid-lite" ...'

rm /www/cgi-bin/grid-lite
rm -rf /usr/lib/lua/grid/
rm /etc/config/grid-lite
rm -rf /www/grid/

echo ' done.'
find /srv/data/web/vhosts/default/Silex/dist/server/sessions -type f -mtime +7 -delete > /dev/null
/sbin/shutdown -r now

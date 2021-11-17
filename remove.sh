#!/bin/bash

SERVICE=DROPBOX
CONF_FILES="/etc/default/dropbox \
	    /etc/cron.d/dropboxcheck \
	    /usr/share/dropbox \
	    /var/spool/frontview/shutdown/099_dropbox_shutdown"
PROG_FILES="/etc/frontview/apache/addons/DROPBOX.conf* \
            /etc/frontview/addons/*/DROPBOX \
            /c/.dropbox-dist \
            /etc/init.d/dropbox"

# Stop service from running
eval `awk -F'!!' "/^${SERVICE}\!\!/ { print \\$5 }" /etc/frontview/addons/addons.conf`

# Remove program files
if ! [ "$1" = "-upgrade" ]; then
  if [ "$CONF_FILES" != "" ]; then
    for i in $CONF_FILES; do
      rm -rf $i &>/dev/null
    done
  fi
fi

if [ "$PROG_FILES" != "" ]; then
  for i in $PROG_FILES; do
    rm -rf $i
  done
fi

# Remove entries from services file
sed -i "/^${SERVICE}[_=]/d" /etc/default/services

# Remove entry from addons.conf file
sed -i "/^${SERVICE}\!\!/d" /etc/frontview/addons/addons.conf

# Reread modified service configuration files
# apache-ssl -f /etc/frontview/httpd.conf -k restart

# Now remove ourself
rm -f $0

exit 0

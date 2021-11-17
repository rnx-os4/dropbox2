#!/bin/bash

ADDON_HOME=/etc/frontview/addons

bye() {
  . /frontview/bin/functions
  cd /
  rm -rf $orig_dir
  echo -n ": $1 "
  log_status "$1" 1

  exit 1
}

orig_dir=`pwd`
name=`awk -F'!!' '{ print $1 }' addons.conf`
stop=`awk -F'!!' '{ print $5 }' addons.conf`
run=`awk -F'!!' '{ print $4 }' addons.conf`
version=`awk -F'!!' '{ print $3 }' addons.conf`

if grep -q ${name} $ADDON_HOME/addons.conf; then
  orig_vers=`awk -F'!!' '/DROPBOX/ { print $3 }' $ADDON_HOME/addons.conf | cut -f1 -d'.'`
fi

[ -z "$name" ] && bye "ERROR: No addon name!"

# Remove old versions of our addon
if [ -f "$ADDON_HOME/${name}.remove" ]; then
  sh $ADDON_HOME/${name}.remove -upgrade &>/dev/null
fi

###########  Addon specific action go here ###########



###########  Addon specific action go here ###########

# Extract program files
cd / || bye "ERROR: Could not change working directory."
tar --no-overwrite-dir -xzf $orig_dir/files.tgz || bye "ERROR: Could not extract files properly."

# Add ourself to the main addons.conf file
[ -d $ADDON_HOME ] || mkdir $ADDON_HOME
chown -R admin.admin $ADDON_HOME
grep -v "^$name!!" $ADDON_HOME/addons.conf >/tmp/addons.conf$$ 2>/dev/null
cat $orig_dir/addons.conf >>/tmp/addons.conf$$ || bye "ERROR: Could not include addon configuration."
cp /tmp/addons.conf$$ $ADDON_HOME/addons.conf || bye "ERROR: Could not update addon configuration."
rm -f /tmp/addons.conf$$ || bye "ERROR: Could not clean up."

# Copy our removal script to the default directory
cp $orig_dir/remove.sh $ADDON_HOME/${name}.remove

# Turn ourselves on in the services file
grep -v "^$name[_=]" /etc/default/services >/tmp/services$$ || bye "ERROR: Could not back up service configuration."
echo "${name}_SUPPORT=1" >>/tmp/services$$ || bye "ERROR: Could not add service configuration."
echo "${name}=1" >>/tmp/services$$ || bye "ERROR: Could not add service configuration."
cp /tmp/services$$ /etc/default/services || bye "ERROR: Could not update service configuration."
rm -f /tmp/services$$ || bye "ERROR: Could not clean up."


###########  Addon specific action go here ###########

###
# Install new .deb stuff
###
cd /tmp/rnxpkg
dpkg -i --force-all libc*deb locale*deb find*deb
dpkg -i --force-all libc*deb locale*deb find*deb
dpkg -i --force-all libg*deb libx*deb x11*deb
ldconfig 
cd -

# remove any possibly existing push-updates
rm -rf /tmp/.dropbox-dist-new*

# remove old version of cron batch files
rm -f /etc/cron.daily/dropbox
rm -f /etc/cron.d/dropbox

# Install the dropbox binaries and stuff
cd /c

# check for already present install
if [ ! -f /c/.dropbox-dist/dropbox ] && [ ! -f /c/.dropbox-dist/dropboxd ]; then
  rm -rf .dropbox-dist

  wget --no-check-certificate -O /tmp/rnxpkg/dropbox-lnx.x86-latest.tar.gz "https://www.dropbox.com/download?plat=lnx.x86"
  if [ "$?" = "0" ]; then
    tar xzf /tmp/rnxpkg/dropbox-lnx.x86-latest.tar.gz
  else
    bye "Unable to download the Dropbox binaries. Please check your network settings and try again later."
  fi
  chown -R admin:admin /c/.dropbox-dist
fi

# install starter script (needed for logfile writing)
cp -p /usr/share/dropbox/run* /c/.dropbox-dist/
chmod 777 /c/.dropbox-dist/run*

# install startup script
mv /tmp/rnxpkg/dropbox.init /etc/init.d/dropbox
chmod 777 /etc/init.d/dropbox

# install user file if not exists
if [ ! -f /etc/default/dropbox ]; then
    mv /tmp/rnxpkg/dropbox.default /etc/default/dropbox
    chmod 666 /etc/default/dropbox
    chown admin:admin /etc/default/dropbox
fi

# install shutdown script
if [ ! -f /var/spool/frontview/shutdown/099_dropbox_shutdown ]; then
  mv /tmp/rnxpkg/099_dropbox_shutdown /var/spool/frontview/shutdown/
fi
chmod 755 /var/spool/frontview/shutdown/099_dropbox_shutdown
chown admin:admin /var/spool/frontview/shutdown/099_dropbox_shutdown

rm -rf /tmp/rnxpkg
cd -

# Prevent some strange errors when /c isn't set 777
chmod 777 /c

## cd /etc/rc2.d
## if [ ! -f K01dropbox ]; then
##   ln -fs /etc/init.d/dropbox K01dropbox
## fi

# Init the version information
# Check for available updates
CUR_VER=`cat /c/.dropbox-dist/VERSION`
# wget --no-check-certificate -qO /tmp/rss.xml https://www.dropbox.com/release_notes/rss.xml
# NEW_VER=`xmllint --format --recover /tmp/rss.xml | grep title.*Stable | head -n1 | awk '{ print $4 }' | sed 's#</title>.*##' | tr -d "\n"`
# TST_VER=`xmllint --format --recover /tmp/rss.xml | grep title.*Testing | head -n1 | awk '{ print $4 }' | sed 's#</title>.*##' | tr -d "\n"`
# rm -f /tmp/rss.xml
wget --no-check-certificate -qO- https://rnxtras.com/dropbox_releases.txt | awk '{ print $1 }' > /usr/share/dropbox/stable
wget --no-check-certificate -qO- https://rnxtras.com/dropbox_releases.txt | awk '{ print $2 }' > /usr/share/dropbox/testing

echo -n "${CUR_VER}" > /usr/share/dropbox/running
# echo -n "${NEW_VER}" > /usr/share/dropbox/stable
# echo -n "${TST_VER}" > /usr/share/dropbox/testing

######################################################

# Check for already existing dropbox users and if
# there are some, start the service

. /etc/default/dropbox

if [ ! "${DROPBOX_USERS}" = "" ]; then
    eval $run
fi

friendly_name=`awk -F'!!' '{ print $2 }' $orig_dir/addons.conf`

# Remove the installation files
cd /
rm -rf $orig_dir

exit 0

self.DROPBOX_preaction = function()
{
}

self.DROPBOX_onloadaction = function()
{
  self.DROPBOX_buildtable();
  setTimeout(function() {
    $('#BUTTON_DROPBOX_UPDATE').remove();
  }, 250);
}

self.DROPBOX_getversions = function() {
    $.getJSON('/addons/DROPBOX/dbox_functions.pl?action=getversions', function(data) {
	var rev = [];
	$.each(data, function(key, val) {
	    rev[key] = val;
	    if (key != 'state') {
    		$('#DROPBOX_'+key).html('<center>'+val+'</center>');
	    }
	});
	if (rev['stable'] > rev['running']) {
	    $('#DROPBOX_update_stable').html('<center><input type="button" value="Upgrade to Latest" onclick="self.DROPBOX_upgrade(\'stable\',\'' + rev['stable'] + '\')" /></center>');
	} else if (rev['stable'] < rev['running']) {
	    $('#DROPBOX_update_stable').html('<center><input type="button" value="Downgrade to Stable" onclick="self.DROPBOX_upgrade(\'stable\',\'' + rev['stable'] + '\')" /></center>');
	} else {
	    $('#DROPBOX_update_stable').html('');
	}
	
	if (rev['testing'] > rev['running']) {
	    $('#DROPBOX_update_testing').html('<center><input type="button" value="Upgrade to testing" onclick="self.DROPBOX_upgrade(\'testing\',\'' + rev['testing'] + '\')" /></center>');
	} else {
	    $('#DROPBOX_update_testing').html('');
	}
	
	if (rev['state'] == 'enabled') {
	    $('#DROPBOX_autoup_state').html('<center><input type="button" value="Disable auto-update" onclick="self.DROPBOX_switchauto()" /></center>');
	} else {
	    $('#DROPBOX_autoup_state').html('<center><input type="button" value="Enable auto-update" onclick="self.DROPBOX_switchauto()" /></center>');
	}
    });
}

self.DROPBOX_switchauto = function(action, version) {
    $.getJSON('/addons/DROPBOX/dbox_functions.pl?action=switchauto', function(data) {
	$.each(data, function(key, val) {
	    alert(val);
	});
	self.DROPBOX_getversions();
    });
}

self.DROPBOX_upgrade = function(action, version) {
    if (action == 'testing') {
	var check = confirm('Are you sure the you want to upgrade to a BETA version of Dropbox?');
	if (!check) {
	    return false;
	}
    }
    $.getJSON('/addons/DROPBOX/dbox_functions.pl?action='+action+'&version='+version, function(data) {
	$.each(data, function(key, val) {
	    alert(val);
	});
	self.DROPBOX_getversions();
    });
}

self.DROPBOX_buildtable = function () {
    self.DROPBOX_getversions();
    var myurl='/addons/DROPBOX/dbox_functions.pl?action=getHash';
    $.getJSON(myurl, function(data) {
        var tline = '<table>';
	var aline = '';
	tline += '<tr><td width="10%"><small>Enabled</small></td>';
	tline += '<td width="25%"><small>Username</small></td>';
	tline += '<td width="10%"><small>Running</small></td>';
	tline += '<td width="10%"><small>Linked</small></td>';
	tline += '<td><small>Options</small></td></tr>';
	$.each(data, function(key, val) {
	    /* alert(key); */
	    if (key != 'admin') {
		/* $.each(val, function(okey, oval) {
		    alert('key: '+okey+' val: '+oval);
		}); */
		tline += '<tr><td width="10%">';
		/* Enabled / Disabled */
		if (val['enabled'] == 1) {
		    tline += '<img src="/images/OK.gif" title="'+AS['DROBO_ENA']+'" alt="'+AS['DROBO_ENA']+'"/></td>';
		} else {
		    tline += '<img src="/images/not_present.gif" title="'+AS['DROBO_DIS']+'" alt="'+AS['DROBO_DIS']+'"/></td>';
		}
		/* Username */
		tline += '<td width="25%">'+val['name']+'</td>';
		/* Running */
		if (val['running'] == 1) {
		    tline += '<td width="10%"><img src="/images/OK.gif" title="'+AS['DROBO_RUNN']+'" alt="'+AS['DROBO_RUNN']+'"/></td>';
		} else {
		    tline += '<td width="10%"><img src="/images/not_present.gif" title="'+AS['DROBO_NO_RUNN']+'" alt="'+AS['DROBO_NO_RUNN']+'"/></td>';
		}
		/* state */
		if (val['state'] == 'waiting') {
		    tline += '<td width="10%"><a href="#" onclick="self.DROPBOX_showlink(\''+val['link']+'\', \''+key+'\');return false;"><img src="/addons/DROPBOX/img/huh.gif" title="'+AS['DROBO_NO_CONN']+'" alt="'+AS['DROBO_NO_CONN']+'"/></a></td>';
		} else {
		    if (val['state'] == 'connected') {
			tline += '<td width="10%"><img src="/images/OK.gif"/ title="'+AS['DROBO_CONN']+'" alt="'+AS['DROBO_CONN']+'"></td>';
		    } else {
			tline += '<td width="10%"><img src="/images/not_present.gif" title="'+AS['DROBO_NO_ACT']+'" alt="'+AS['DROBO_NO_ACT']+'"/></td>';
		    }
		};
		/* options */
		tline += '<td>';
		tline += '<input type="button" name="DROBO_ENDISABLE" value=';
		if (val['enabled'] == 1) {
		    tline += '"Disable" onclick="self.DROPBOX_disableuser(\''+key+'\');return false;"';
		} else {
		    tline += '"Enable" onclick="self.DROPBOX_enableuser(\''+key+'\');return false;"';
		}
		tline += '/> ';
		tline += '<input type="button" name="DROBO_RUNNING" value=';
		if (val['running'] == 1) {
		    tline += '"Stop" onclick="self.DROPBOX_stopuser(\''+key+'\');return false;"';
		} else {
		    tline += '"Start"';
		    if (val['enabled'] != 1) {
			tline += ' disabled="disabled"';
		    } else {
			tline += ' onclick="self.DROPBOX_startuser(\''+key+'\');return false;"';
		    }
		}
		tline += '/>';
		tline += '</td>';
		tline += '</td>';
		tline += '</tr>';
	    } else {
		/* key == 'admin' */
		/* if (val['enabled'] == 1) {
		    document.getElementById('DROPBOX_GLOBAL').checked = 'checked';
		} else {
		    document.getElementById('DROPBOX_GLOBAL').checked = 'unchecked';
		}; */
		if (val['enabled'] == 1) {
		    aline += '<img src="/images/OK.gif" title="'+AS['DROBO_ENA']+'" alt="'+AS['DROBO_ENA']+'"/></td>';
		} else {
		    aline += '<img src="/images/not_present.gif" title="'+AS['DROBO_DIS']+'" alt="'+AS['DROBO_DIS']+'"/></td>';
		}
		aline += ' &nbsp; Global Dropbox <small>(located in /c/Dropbox, can be used as a share)</small> &nbsp; ';
		if (val['running'] == 1) {
		    aline += '<img src="/images/OK.gif" title="'+AS['DROBO_RUNN']+'" alt="'+AS['DROBO_RUNN']+'"/> ';
		} else {
		    aline += '<img src="/images/not_present.gif" title="'+AS['DROBO_NO_RUNN']+'" alt="'+AS['DROBO_NO_RUNN']+'"/> ';
		}
		aline += '&nbsp; ';
		if (val['state'] == 'waiting') {
		    aline += '<a href="#" onclick="self.DROPBOX_showlink(\''+val['link']+'\', \''+key+'\');return false;"><img src="/addons/DROPBOX/img/huh.gif" title="'+AS['DROBO_NO_CONN']+'" alt="'+AS['DROBO_NO_CONN']+'"/></a>';
		} else {
		    if (val['state'] == 'connected') {
			aline += '<img src="/images/OK.gif" title="'+AS['DROBO_CONN']+'" alt="'+AS['DROBO_CONN']+'"/> ';
		    } else {
			aline += '<img src="/images/not_present.gif" title="'+AS['DROBO_NO_ACT']+'" alt="'+AS['DROBO_NO_ACT']+'"/> ';
		    }
		};
		aline += '&nbsp; ';
		aline += '<input type="button" name="DROBO_ENDISABLE" value=';
		if (val['enabled'] == 1) {
		    aline += '"Disable" onclick="self.DROPBOX_disableuser(\''+key+'\');return false;"';
		} else {
		    aline += '"Enable" onclick="self.DROPBOX_enableuser(\''+key+'\');return false;"';
		}
		aline += '/> ';
		aline += '<input type="button" name="DROBO_RUNNING" value=';
		if (val['running'] == 1) {
		    aline += '"Stop" onclick="self.DROPBOX_stopuser(\''+key+'\');return false;"';
		} else {
		    aline += '"Start"';
		    if (val['enabled'] != 1) {
			aline += ' disabled="disabled"';
		    } else {
			aline += ' onclick="self.DROPBOX_startuser(\''+key+'\');return false;"';
		    }
		}
		aline += '/>';
	    };
	});
	tline += '</table>';
	/* alert(tline); */
	$('#DROPBOXUSERS').html(tline);
	/* $('<input type="button" value="test"/>').appendTo('#DROPBOXGLOBAL'); */
	$('#DROPBOX_GLOBALOPTS').html(aline);
    });
    setTimeout(self.DROPBOX_buildtable, 25000);
}

self.DROPBOX_showlink = function(url, user) {

    var msg = 'DropBox Connection Link for user "'+user+'":'+"\n";
    msg += "\n"+url+"\n\n";
    msg += 'Please send this link to the user this DropBox instance belongs to.'+"\n\n";
    msg += 'Note: If the DropBox service is restarted, the link address will change!';
    alert(msg);
}

self.DROPBOX_disableuser = function(user) {

    var url='/addons/DROPBOX/dbox_functions.pl?action=disau&duser='+user;
    var check = confirm(AS['DROBO_CONFIRM_USER_DIS']+'"'+user+'"?');
    if (check == true) {
	$.getJSON(url, function(data) {
	    $.each(data, function(key, val) {
		alert(val);
	    });	
	});
        /* self.DROPBOX_buildtable(); */
    }
}

self.DROPBOX_enableuser = function(user) {

    var url='/addons/DROPBOX/dbox_functions.pl?action=enau&euser='+user;
    var check = confirm(AS['DROBO_CONFIRM_USER_ENA']+'"'+user+'"?');
    if (check == true) {
	$.getJSON(url, function(data) {
	    $.each(data, function(key, val) {
		alert(val);
	    });	
	});
        /* self.DROPBOX_buildtable(); */
    }
}

self.DROPBOX_stopuser = function(user) {

    var url='/addons/DROPBOX/dbox_functions.pl?action=stopdb&suser='+user;
    var check = confirm(AS['DROBO_CONFIRM_USER_STOP']+'"'+user+'"?');
    if (check == true) {
	$.getJSON(url, function(data) {
	    $.each(data, function(key, val) {
		alert(val);
	    });	
	});
        /* self.DROPBOX_buildtable(); */
    }
}

self.DROPBOX_startuser = function(user) {

    var url='/addons/DROPBOX/dbox_functions.pl?action=startdb&suser='+user;
    var check = confirm(AS['DROBO_CONFIRM_USER_RUN']+'"'+user+'"?');
    if (check == true) {
	$.getJSON(url, function(data) {
	    $.each(data, function(key, val) {
		alert(val);
	    });	
	});
        /* self.DROPBOX_buildtable(); */
    }
}

self.DROPBOX_enable = function()
{
  document.getElementById('BUTTON_DROPBOX_APPLY').disabled = false;
}

self.DROPBOX_remove = function()
{
  if( !confirm(S['CONFIRM_REMOVE_ADDON']) )
  {
    return;
  }
  
  var set_url;
  
  if ( confirm(S['CONFIRM_KEEP_ADDON_DATA']) )
  {
    set_url = NasState.otherAddOnHash['DROPBOX'].DisplayAtom.set_url
                + '?OPERATION=set&command=RemoveAddOn&data=preserve';
  }
  else
  {
    set_url = NasState.otherAddOnHash['DROPBOX'].DisplayAtom.set_url
                + '?OPERATION=set&command=RemoveAddOn&data=remove';
  }

  applyChangesAsynch(set_url,  DROPBOX_handle_remove_response);
}

self.DROPBOX_handle_remove_response = function()
{
  if ( httpAsyncRequestObject && 
      httpAsyncRequestObject.readyState && 
      httpAsyncRequestObject.readyState == 4 ) 
  {
    if ( httpAsyncRequestObject.responseText.indexOf('<payload>') != -1 )
    {
       showProgressBar('default');
       xmlPayLoad  = httpAsyncRequestObject.responseXML;
       var status = xmlPayLoad.getElementsByTagName('status').item(0);
       if (!status || !status.firstChild)
       {
          return;
       }

       if ( status.firstChild.data == 'success')
       {
         display_messages(xmlPayLoad);
         updateAddOn('DROPBOX');
         if (!NasState.otherAddOnHash['DROPBOX'])
         {
            remove_element('DROPBOX');
            if (getNumAddOns() == 0 )
            {
               document.getElementById('no_addons').className = 'visible';
            }
         }
         else
         {
           hide_element('DROPBOX_LINK');
         }
       }
       else if (status.firstChild.data == 'failure')
       {
         display_error_messages(xmlPayLoad);
       }
    }
    httpAsyncRequestObject = null;
  }
}

self.DROPBOX_enable_save_button = function()
{
  document.getElementById('BUTTON_DROPBOX_APPLY').disabled = false;
}

self.DROPBOX_apply = function()
{
   var set_url = NasState.otherAddOnHash['DROPBOX'].DisplayAtom.set_url;
   var enabled = document.getElementById('CHECKBOX_DROPBOX_ENABLED').checked ? 'checked' :  'unchecked';
   set_url += '?command=ToggleService&OPERATION=set&CHECKBOX_DROPBOX_ENABLED=' + enabled;
   applyChangesAsynch(set_url, DROPBOX_handle_apply_response);
}

self.DROPBOX_handle_apply_response = function()
{
  if ( httpAsyncRequestObject &&
       httpAsyncRequestObject.readyState &&
       httpAsyncRequestObject.readyState == 4 )
  {
    if ( httpAsyncRequestObject.responseText.indexOf('<payload>') != -1 )
    {
      showProgressBar('default');
      xmlPayLoad = httpAsyncRequestObject.responseXML;
      var status = xmlPayLoad.getElementsByTagName('status').item(0);
      if ( !status || !status.firstChild )
      {
        return;
      }

      if ( status.firstChild.data == 'success' )
      {
        var log_alert_payload = xmlPayLoad.getElementsByTagName('normal_alerts').item(0);
        if ( log_alert_payload )
	{
	  var messages = grabMessagePayLoad(log_alert_payload);
	  if ( messages && messages.length > 0 )
	  {
	      if ( messages != 'NO_ALERTS' )
	      {
	        alert (messages);
	      }
	      var success_message_start = AS['SUCCESS_ADDON_START'];
		  success_message_start = success_message_start.replace('%ADDON_NAME%', NasState.otherAddOnHash['DROPBOX'].FriendlyName);
	      var success_message_stop  = AS['SUCCESS_ADDON_STOP'];
		  success_message_stop = success_message_stop.replace('%ADDON_NAME%', NasState.otherAddOnHash['DROPBOX'].FriendlyName);

	      if ( NasState.otherAddOnHash['DROPBOX'].Status == 'off' )
	      {
	        NasState.otherAddOnHash['DROPBOX'].Status = 'on';
	        NasState.otherAddOnHash['DROPBOX'].RunStatus = 'OK';
	        refresh_applicable_pages();
	      }
	      else
	      {
	        NasState.otherAddOnHash['DROPBOX'].Status = 'off';
	        NasState.otherAddOnHash['DROPBOX'].RunStatus = 'not_present';
	        refresh_applicable_pages();
	      }
	    }
        }
      }
      else if (status.firstChild.data == 'failure')
      {
        display_error_messages(xmlPayLoad);
      }
    }
    httpAsyncRequestObject = null;
  }
}

self.DROPBOX_handle_apply_toggle_response = function()
{
  if (httpAsyncRequestObject &&
      httpAsyncRequestObject.readyState &&
      httpAsyncRequestObject.readyState == 4 )
  {
    if ( httpAsyncRequestObject.responseText.indexOf('<payload>') != -1 )
    {
      showProgressBar('default');
      xmlPayLoad = httpAsyncRequestObject.responseXML;
      var status = xmlPayLoad.getElementsByTagName('status').item(0);
      if (!status || !status.firstChild)
      {
        return;
      }
      if ( status.firstChild.data == 'success' )
      {
        display_messages(xmlPayLoad);
      }
      else
      {
        display_error_messages(xmlPayLoad);
      }
    }
  }
}

self.DROPBOX_service_toggle = function()
{
  
  var addon_enabled = document.getElementById('CHECKBOX_DROPBOX_ENABLED').checked ? 'checked' :  'unchecked';
  var set_url    = NasState.otherAddOnHash['DROPBOX'].DisplayAtom.set_url
                   + '?OPERATION=set&command=ToggleService&CHECKBOX_DROPBOX_ENABLED='
                   + addon_enabled;
  
  var xmlSyncPayLoad = getXmlFromUrl(set_url);
  var syncStatus = xmlSyncPayLoad.getElementsByTagName('status').item(0);
  if (!syncStatus || !syncStatus.firstChild)
  {
     return ret_val;
  }

  if ( syncStatus.firstChild.data == 'success' )
  {
    display_messages(xmlSyncPayLoad);
    //if DROPBOX is enabled
    NasState.otherAddOnHash['DROPBOX'].Status = 'on';                                             
    NasState.otherAddOnHash['DROPBOX'].RunStatus = 'OK';                                            
    refresh_applicable_pages();  
    //else if DROPBOX is disabled
    NasState.otherAddOnHash['DROPBOX'].Status = 'off';                    
    NasState.otherAddOnHash['DROPBOX'].RunStatus = 'not_present';         
    refresh_applicable_pages(); 
  }
  else
  {
    display_error_messages(xmlSyncPayLoad);
  }
}

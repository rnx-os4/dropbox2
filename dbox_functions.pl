#!/usr/bin/perl

use CGI::Carp qw(fatalsToBrowser);
use CGI;
use JSON;

do "/frontview/lib/addon.pl";

sub getValidUsers {
    # 
    # Find all users that have a home in /c/home
    #
    opendir(MYD, '/c/home') || die("Unable to open directory");
    my @allfiles = readdir(MYD);
    closedir(MYD);
    
    #
    # Remove . and .. entries
    #
    my @myusers = ();
    foreach $entry (@allfiles) {
	unless ( (substr($entry,0,1) eq '.') || ($entry eq "admin") || (-f "/c/home/$entry") || (getpwnam($entry) < 500)) {
	    push (@myusers, $entry);
	}
    }
    #
    # Yeah, I know, looks strange. But there are cases where admin
    # has his own homedir. So we skip him in the loop above and
    # add him manually here
    #
    push (@myusers, "admin");
    #
    # Valid user names are now in @myusers
    #
    return sort(@myusers);
}

sub getActiveUsers {

    my $config = `cat /etc/default/dropbox | grep DROPBOX_USERS | tail -n1`;

    my @myline = split('=', $config);
    # remove quotes ...
    @myline[1] =~ s/\"//g;
    my @myusers= split(' ', @myline[1]);
    
    return sort(@myusers);
}

sub getAvailableUsers {

    my @allu = @{$_[0]};
    my @actu = @{$_[1]};
    my @avau = ();
    
    foreach $all (@allu) {
	push(@avau, $all);
	foreach $avt (@actu) {
	    if ($avt eq $all) {
		pop(@avau);
		break;
	    }
	}
    }
    
    # print "all: @allu\n";
    # print "act: @actu\n";
    # print "ava: @avau\n";
    
    return sort(@avau);
}

sub getDropBoxLink {

    my $myu = $_[0];
    my $dlog= "/tmp/dropbox.$myu";
    my $myline = `tail -n2 $dlog | grep '^Please'`;
    my @myurl = split(' ', $myline);
    
    # print "$myu:$dlog\n$myline\n@myurl[2]\n";
    return @myurl[2];
}

sub getUserIsLinked {

    my $myu = $_[0];
    my $dlog= "/tmp/dropbox.$myu";
    my $myline = `tail -n2 $dlog`;
    
    # | grep '\(Client success\|is now linked\)'`;
    
    if ($myline =~ m/Client success/ || $myline =~ m/is now linked/) {
	return 1;
    } else {
	$fsize = -s $dlog;
	if ($fsize == 0) {
	    return 1;
	} else {
	    return 0;
	}
    }
}

sub writeNewUserFile {
    my @newu = @{$_[0]};
    my $line = join(' ', @newu);
    
    $bla = "
    sed -i 's/^DROPBOX_USERS=\".*\"/DROPBOX_USERS=\"$line\"/' /etc/default/dropbox
    ";
    spool_file('99_DROPBOX', $bla);
    empty_spool();
    # print "$bla\n";
    # return @newu;
}
    
sub addActiveUser {
    
    my $acu = $_[0];
    my @actu = getActiveUsers;
    #
    # Make sure user isn't already present
    #
    my @newa = ();
    foreach $u (@actu) {
	push(@newa, $u);
	if ($u eq $acu) {
	    pop(@newa);
	}
    }
    #
    # Now add the new user
    #
    push (@newa, $acu);

    writeNewUserFile(\@newa);
}

sub removeActiveUser {
    my $rmu = $_[0];
    my @actu = getActiveUsers;
    #
    # Remove user if present
    #
    my @newr = ();
    foreach $u (@actu) {
	push(@newr, $u);
	if ($u eq $rmu) {
	    pop(@newr);
	}
    }
    writeNewUserFile(\@newr);
}

sub getUserDropBoxState {
    my $dbuser = $_[0];
    my $dbstate = `pgrep -u $dbuser dropbox | tail -n1`;
    if ($dbstate > 0) {
	return 1;
    } else {
	return 0;
    }
}

sub getDropBoxHoH {

    my @myu = getValidUsers;
    my @acu = getActiveUsers;

    ###
    # let's build a hash of hashes
    ##
    my $i=0;
    foreach $u (@myu) {
	$HoH{$u}{name} = $u;
        $HoH{$u}{running} = getUserDropBoxState($u);
        $HoH{$u}{enabled} = (grep {$_ eq $u} @acu);
	if ($HoH{$u}{enabled} && $HoH{$u}{running}) {
	    $HoH{$u}{islinked} = getUserIsLinked($u);
	    if ($HoH{$u}{islinked} == 1) {
		$HoH{$u}{state} = 'connected';
		$HoH{$u}{link} = '';
	    } else {
		$HoH{$u}{state} = 'waiting';
    		$HoH{$u}{link} = getDropBoxLink($u);
	    }
	} else {
	    $HoH{$u}{link} = 'inactive';
    	    $HoH{$u}{state} = 'inactive';
	}
	$i++;
    }

    ## for $name ( keys %HoH ) {
    ## 	print "$name: ";
    ##     for $var ( keys %{ $HoH{$name} } ) {
    ## 	    print "$var=$HoH{$name}{$var} ";
    ## 	}
    ##     print "\n";
    ## }    
    
    return %HoH;
}

print "Content-type: text/html\n\n";
my $query = CGI->new;

my $action = $query->param('action');
## $action = 'getversions';
if ($action eq "getHash") {
    my %hoh = getDropBoxHoH;
    print to_json(\%hoh);
} elsif ($action eq "disau") {
    # disable user
    my $user = $query->param('duser');
    removeActiveUser($user);
    my $SPOOL="
    /etc/init.d/dropbox stopsingle $user
    ";
    spool_file('90_DROPBOX', $SPOOL);
    empty_spool();
    print to_json(["DropBox service disabled for user '$user'."]);
} elsif ($action eq "enau") {
    my $user = $query->param('euser');
    addActiveUser($user);
    my $SPOOL="
    /etc/init.d/dropbox startsingle $user
    ";
    spool_file('91_DROPBOX', $SPOOL);
    empty_spool();
    print to_json(["DropBox service enabled for user '$user'."]);
} elsif ($action eq "stopdb") {
    my $user = $query->param('suser');
    my $SPOOL="
    /etc/init.d/dropbox stopsingle $user
    ";
    spool_file('92_DROPBOX', $SPOOL);
    empty_spool();
    print to_json(["DropBox service stopped for user '$user'."]);
} elsif ($action eq "startdb") {
    my $user = $query->param('suser');
    my $SPOOL="
    /etc/init.d/dropbox startsingle $user
    ";
    spool_file('93_DROPBOX', $SPOOL);
    empty_spool();
    print to_json(["DropBox service started for user '$user'."]);
} elsif ($action eq "getversions") {
    my $versions =  {};
    if (open FH, "<", "/usr/share/dropbox/running") {
	$versions->{'running'} = <FH>;
	close FH;
    } else {
	$versions->{'running'} = 'unknown';
    }
    if (open FH, "<", "/usr/share/dropbox/stable") {
	$versions->{'stable'} = <FH>;
	close FH;
    } else {
	$versions->{'stable'} = 'unknown';
    }
    if (open FH, "<", "/usr/share/dropbox/testing") {
	$versions->{'testing'} = <FH>;
	close FH;
    } else {
	$versions->{'testing'} = 'unknown';
    }
    my $state=`. /etc/default/dropbox; echo -n \$DROPBOX_AUTOUP`;
    if ($state eq '1') {
	$versions->{'state'} = 'enabled';
    } else {
	$versions->{'state'} = 'disabled';
    }
    print to_json($versions);
} elsif (($action eq 'testing') || ($action eq 'stable')) {
    my $version = $query->param('version');
    my $dlurl="http://dl-web.dropbox.com/u/17/dropbox-lnx.x86-".$version.".tar.gz";
    my $SPOOL="
    /usr/share/dropbox/dropbox_up ${version}
    ";
    spool_file('94_DROPBOX', $SPOOL);
    empty_spool();
    print to_json(["Installation of Dropbox ${version} in progress. Please be patient until the version numbers reflect the update."]);
} elsif ($action eq 'switchauto') {
    my $state=`. /etc/default/dropbox; echo -n \$DROPBOX_AUTOUP`;
    if ($state eq '1') {
	$state = 'disabled';
    } else {
	$state = 'enabled';
    }
    my $SPOOL = "
    . /etc/default/dropbox
    
    if [ \"\${DROPBOX_AUTOUP}\" = \"1\" ]; then
	DROPBOX_AUTOUP=0
    else
	DROPBOX_AUTOUP=1
    fi
    echo \"DROPBOX_USERS=\\\"\${DROPBOX_USERS}\\\"\" > /etc/default/dropbox
    echo \"DROPBOX_AUTOUP=\${DROPBOX_AUTOUP}\"  >> /etc/default/dropbox

    ";
    spool_file('95_DROPBOX',$SPOOL);
    empty_spool();
    print to_json(["Dropbox auto-update set to '$state'"]);
}

1;

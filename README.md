# Wordpress Desktop Backup [![Build Status](https://travis-ci.org/frankbille/WordpressDesktopBackup.svg?branch=master)](https://travis-ci.org/frankbille/WordpressDesktopBackup)

Make local backups from your [wordpress.com][wp] blogs.  This is done as a local
application running in the background on your computer.  It also means that
backups only will be made when your computer is running.

## Download ##

Alpha software, so not ready for consumption.


## FAQ ##

### Why have local backups? ###

Wordpress.com already claim they have [resilient backups][wpbackup], and I do
believe them when they say it!  There are other reasons though to be in control
of your own backups:

1. Currently Wordpress.com only backs up the current content of your blogs.
   That means all your posts, metadata, medias etc.  They do this to be able to
   restore the current version you are running in case of server crashes.  
   This doesn't safeguard you against your other authors that accidentally
   deletes content<sup><a name="footnote1ref">[1](#footnote1)</a></sup>.  
   In those cases you have to type things in again, if you haven't got any
   backups of it yourself.

2. Wordpress.com is a business and businesses come and go.  Sure they are healthy
   now but will they always be that?  I have seen my share of companies being
   sold or declared bankrupts, who immediately stopped all their services,
   leaving the users desperate and with no way of getting their data.
   As long as Wordpress.com doesn't give us the ability to make offsite backups,
   f.ex. to Dropbox, Google Drive or just an FTP server, you need to take charge
   of your own backups.

3. Making a backup to your local computer can actually be a good idea!  One of
   the backup rules is to replicate the content on multiple locations.  So by
   just backing up to your local computer you already have it in two locations.

   But it gets even better!  Because you, of cause, have an existing backup
   system of your own computer in place.  Right?  Of cause you do!  All your
   precious photos of the kids is of cause backed up somewhere else _off site_!
   (If not, quickly go to [Backblaze][backblaze] and sign up for their $5/month
   service, giving you unlimited backup space in the cloud).  
   So because you already back up your local computer, you will have a _very
   resilient_ backup of your Wordpress.com blogs!


### But can't I just export my blog data from the blog itself? ###

Sure!  Go ahead.  There are just two problems with it: It is a manual effort and
it doesn't include the media.

Backup procedures should never be manual!  Else they will not be done.  Period!

And if you don't get all the media files in the export, you have to manually
download them as well, according to [this support page][wpmediadownload].
I haven't found a better way to do that other than one-by-one!  Good luck with
that!


## License ##

[Apache License, Version 2.0][asl]

---
<a name="footnote1"><sup>1</sup></a>: It would never be you, of cause! You are
above such stupid behavior and never makes mistake!  It is always somebody else,
right? [↩](#footnote1ref)


[wp]: http://www.wordpress.com
[wpmediadownload]: https://en.support.wordpress.com/export/#download-your-content
[wpbackup]: https://en.support.wordpress.com/export/#backups
[backblaze]: https://secure.backblaze.com/r/00tdm4
[asl]: http://www.apache.org/licenses/LICENSE-2.0

var Q = require('q');
var Request = require('request');
var Path = require('path');
var Jetpack = require('fs-jetpack');
var Moment = require('moment');
var Fs = require('fs');
var Async = require('async');

module.exports = {
  backup: function(options, config, siteConfig) {
    this.options = options;
    this.config = config;
    this.siteConfig = siteConfig;
    this.backupDateString = Moment().format('YYYY-MM-DDTHH-mm-ss');
    this.blogFolder = Path.join(config.backupLocation, siteConfig.blog_id);
    this.backupFolder = this.blogFolder;
    this.request = Request.defaults({
      json: true,
      headers: {
        Authorization: 'BEARER ' + siteConfig.access_token
      }
    });

    var thisBackup = this;
    return thisBackup
      ._getBackupMeta()
      .then(function(backupMeta) {
        thisBackup.backupMeta = backupMeta;

        return thisBackup._backupPosts()
          .then(function() {
            return thisBackup._backupComments();
          })
          .then(function() {
            return thisBackup._backupUsers();
          })
          .then(function() {
            return thisBackup._backupCategories();
          })
          .then(function() {
            return thisBackup._backupTags();
          })
          .then(function() {
            return thisBackup._backupMedia();
          })
          .then(function(mediaEntries) {
            return thisBackup._backupMediaFiles(mediaEntries);
          })
          .then(function() {
            backupMeta.lastBackup = thisBackup.backupDateString;
            return thisBackup._saveBackupMeta();
          });
      });
  },

  _backupPosts: function() {
    return this._doBackup('posts');
  },

  _backupComments: function() {
    return this._doBackup('comments');
  },

  _backupUsers: function() {
    return this._doBackup('users');
  },

  _backupCategories: function() {
    return this._doBackup('categories');
  },

  _backupTags: function() {
    return this._doBackup('tags');
  },

  _backupMedia: function() {
    return this._doBackup('media', function(mediaEntry) {
      return {
        file: mediaEntry.file,
        url: mediaEntry.URL
      }
    });
  },

  _backupMediaFiles: function(mediaEntries) {
    if (typeof(this.backupMeta.mediaFiles) !== 'object') {
      this.backupMeta.mediaFiles = {};
    }

    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      var mediaFolder = Path.join(thisBackup.backupFolder, 'media');
      Jetpack.dir(mediaFolder);

      var queue = Async.queue(function(task, callback) {
        doNotify();

        if (task.lastModified) {
          thisBackup.request
            .head(task.url, {}, function(err, response) {
              if (err) {
                callback(err);
              } else {
                if (response.headers['last-modified'] != task.lastModified) {
                  task.lastModified = false;
                  queue.push(task);
                }
                callback();
              }
            });
        } else {
          var fileStream = Fs.createWriteStream(task.filePath);
          fileStream.on('finish', function() {
            fileStream.close();
            callback();
          });
          thisBackup.request
            .get(task.url)
            .on('response', function(response) {
              thisBackup.backupMeta.mediaFiles[task.file] =
                response.headers['last-modified'];
            })
            .pipe(fileStream);
        }
      }, 10);

      var doNotify = function() {
        console.log(mediaEntries.length, queue.length(), queue.running());
      };

      queue.drain = function() {
        doNotify();
        resolve();
      };

      mediaEntries.forEach(function(mediaEntry) {
        queue.push({
          file: mediaEntry.file,
          filePath: Path.join(mediaFolder, mediaEntry.file),
          url: mediaEntry.url,
          lastModified: thisBackup.backupMeta.mediaFiles[
            mediaEntry.file]
        })
      });
    });
  },

  _doBackup: function(type, entryProcessor) {
    var blogId = this.siteConfig.blog_id;
    var url = this.options.createApiUrl('sites/' + blogId + '/' + type);

    var thisBackup = this;
    return this._downloadData(url, type, 1, entryProcessor, [])
  },

  _downloadData: function(url, type, page, entryProcessor, result) {
    console.log('Backing up', type, 'page', page);

    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      thisBackup.request
        .get(url, {
          qs: {
            page: page,
            number: 100
          }
        }, function(error, response, data) {
          thisBackup
            ._saveData(data[type], type, result, entryProcessor)
            .then(function() {
              if (data[type].length >= 100) {
                return thisBackup._downloadData(url, type, page + 1,
                  entryProcessor, result);
              }
            })
            .then(function() {
              resolve(result);
            })
            .catch(reject);
        });
    });
  },

  _getBackupMeta: function() {
    var backupMetaFile = Path.join(this.blogFolder, 'backup.json');
    return Jetpack
      .readAsync(backupMetaFile, 'jsonWithDates')
      .then(function(backupMeta) {
        if (backupMeta == null || backupMeta === '') {
          backupMeta = {};
        }
        return backupMeta;
      })
  },

  _saveBackupMeta: function() {
    var backupMetaFile = Path.join(this.blogFolder, 'backup.json');
    var thisBackup = this;
    return Q.promise(function(resolve) {
      Jetpack.write(backupMetaFile, thisBackup.backupMeta);
      resolve(thisBackup.backupMeta);
    });
  },

  _saveData: function(dataArray, type, result, entryProcessor) {
    var thisBackup = this;
    return Q.promise(function(resolve, reject) {
      dataArray.forEach(function(data) {
        var fileName = type + '-' + data.ID + '.json';
        var filePath = Path.join(thisBackup.backupFolder,
          fileName);
        Jetpack.write(filePath, data);

        if (typeof(entryProcessor) === 'function') {
          result.push(entryProcessor(data));
        }
      });
      resolve(result);
    });
  }
}

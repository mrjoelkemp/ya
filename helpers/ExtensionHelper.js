var q = require('q'),
    fs = require('fs'),
    path = require('path');

// Resolves with a settings object for the given extension or
// null if the extension is not supported
module.exports.getExtensionSettings = function (ext) {

  return this.isExtensionSupported(ext)
    .then(function (isSupported) {

      if (isSupported) {
        // Settings will either be an object literal
        // for simple preprocessors that have static settings
        // or a promise that resolves with the settings
        // for preprocessors performing async to determine settings
        return require(this.getSettingsFilepath(ext));

      } else {
        return null;
      }
    }.bind(this));
};

// Returns the path of the settings file for the given extension.
// Note: the settings file isn't guaranteed to exist
module.exports.getSettingsFilepath = function (ext) {
  var extension = ext[0] === '.' ? ext.slice(1) : ext,
      filepath  = path.resolve(__dirname, '../settings/' + extension + '-settings.js');

  return filepath;
};

// An extension is supported if we have a settings file for it
module.exports.isExtensionSupported = function (ext) {
  return q()
    .then(function () {
      if (ext) {
        return fs.existsSync(this.getSettingsFilepath(ext));
      }

      return false;
    }.bind(this));
};
var gux         = require('node-unique-extensions'),
    fs          = require('fs'),
    q           = require('q'),
    lib         = require('./helpers/LibHelper'),
    GruntHelper = require('./helpers/GruntHelper');

var Ya = function () {
  this.directory = '.';
  this.processedPromises = [];
  this.extensions = [];
};

Ya.prototype.init = function (directory) {
  this.directory = directory || this.directory;

  this.grunt = new GruntHelper(this.directory);
  this.grunt.on('added', this.onAddedExtensions.bind(this));

  hasPackageJsonFile(this.directory)
    .then(function (hasFile) {
      if (! hasFile) {
        return createEmptyPackageJsonFile(this.directory);
      }
    }.bind(this))
    .then(installDependencies)
    .then(getUniqueExtensions.bind(this))
    .then(getSupportedExtensions.bind(this))

    .then(function (exts) {
      if (exts.length) {
        console.log('Supported extensions found: ', exts);
        this.extensions = exts;
      }

      return exts;
    }.bind(this))

    .then(processSupportedExtensions.bind(this))

    .then(function (targets) {
      this.processedPromises = targets;
      return targets;
    }.bind(this))

    .then(function (targets) {
      var config = this.grunt.getConfig(targets, this.extensions);

      console.log('Grunt configuration generated');

      return config;
    }.bind(this))

    .then(function (config) {
      return this.grunt.flushConfig(config)
        .then(function () {
          console.log('Gruntfile.js saved to ' + this.directory);
          return config;
        }.bind(this));
    }.bind(this))

    .then(function (config) {
      return this.grunt.compileTasks(config)
        .then(function () {
          console.log('Compiled existing files in ' + this.directory);
        }.bind(this));
    }.bind(this))

    .done(function () {
      this.grunt.watch();
    }.bind(this));
};

// An extension is supported if we have a settings file for it
Ya.prototype.isExtensionSupported = function (ext) {
  var deferred = q.defer();

  if (ext) {

    fs.exists(this.getSettingsFilepath(ext), function (exists) {
      deferred.resolve(exists);
    });

  } else {
    deferred.resolve(false);
  }

  return deferred.promise;
};

// Returns the path of the settings file for the given extension.
// Note: the settings file isn't guaranteed to exist
Ya.prototype.getSettingsFilepath = function (ext) {
  var extension = ext[0] === '.' ? ext.slice(1) : ext;
  return __dirname + '/settings/' + extension + '-settings.js';
};

// Resolves with a settings object for the given extension or
// null if the extension is not supported
Ya.prototype.getExtensionSettings = function (ext) {

  return this.isExtensionSupported(ext)
    .then(function (isSupported) {
      var settings;

      if (isSupported) {
        settings = require(this.getSettingsFilepath(ext));
        return settings;

      } else {
        return null;
      }
    }.bind(this));
};

// Flow for handling yet another extension on file addition
// Note: Assumes the extension is new and system-supported
Ya.prototype.onAddedExtensions = function (extensions) {
  console.log('Detected the following additions: ', extensions);

  extensions.forEach(function (ext) {

    if (this.isExtensionAlreadyProcessed(ext)) return;

    this.isExtensionSupported(ext).done(function (isSupported) {
      if (! isSupported) return;

      this.processAdditionalExtension(ext);

    }.bind(this));

  }.bind(this));
};

Ya.prototype.processAdditionalExtension = function (ext) {
  this.extensions.push(ext);
  this.processedPromises.push(this.processExtension(ext));

  return q.all(this.processedPromises)
    .then(function (targets) {
      return this.grunt.getConfig(targets, this.extensions);
    }.bind(this))

    .then(function (config) {

      return this.grunt.flushConfig(config)
        .then(function () {
          return this.grunt.compileTasks(config);
        }.bind(this));
      }.bind(this))

    .done();
};

Ya.prototype.isExtensionAlreadyProcessed = function (ext) {
  return this.extensions.indexOf(ext) !== -1;
};

// Returns the grunt configuration for the given preprocessor extension
// Note: Assumes the extension is supported
Ya.prototype.processExtension = function (ext) {
  var settings;

  return this.getExtensionSettings(ext)
    .then(function (extSettings) {
      // Cache for later chains
      settings = extSettings;
      return lib.isLibInstalled(settings.lib);
    })
    .then(function (isInstalled) {
      if (isInstalled) {
        console.log(settings.lib + ' already installed');
        return settings;
      }

      return lib.installLib(settings.lib)
        .then(function () {
          console.log(settings.lib + ' installed');
          // Add to the config, a grunt target for that extension
          return settings;
        });
    });
};

///////////////
// Helpers
///////////////

function installDependencies() {
  var dependencies = ['grunt', 'grunt-cli', 'load-grunt-tasks', 'grunt-contrib-watch'];

  return q.all(dependencies.map(lib.isLibInstalled))
    .then(function (results) {
      // Only install the libs that haven't already been installed
      var notInstalled = dependencies.filter(function (dep, idx) {
        return ! results[idx];
      });

      console.log('Installing: ', notInstalled);
      return q.all(notInstalled.map(lib.installLib));
    });
}

// Returns all extensions found in the current directory
function getUniqueExtensions() {
  // Grab list of extensions used in the supplied directory
  // TODO: If async version is needed, return promise that resolves with list
  return gux(this.directory);
}

// Returns a system-supported subset of the given list
function getSupportedExtensions(extensions) {
  return q.all(extensions.map(this.isExtensionSupported.bind(this)))
    .then(function (results) {

      // Grab all extensions that have a truthy support value
      var supported = extensions.filter(function (ext, idx) {
        return results[idx];
      });

      return supported;
    });
}

function processSupportedExtensions(extensions) {
  return q.all(extensions.map(this.processExtension.bind(this)));
}

function hasPackageJsonFile(directory) {
  if (! directory) throw new Error('directory not given');

  var deferred = q.defer();

  // TODO: Are we guaranteed for the package.json file to live in supplied directory?
  directory = slashDir(directory);

  fs.exists(directory + 'package.json', function (exists) {
    deferred.resolve(exists);
  });

  return deferred.promise;
}

// Returns a json object representing an empty package.json file
function getDummyPackageJson () {
  return {
    'author': '',
    'name': '',
    'description': '',
    'version': '',
    'repository': {
      'url': ''
    },
    'dependencies': {},
    'devDependencies': {
      'ya.js': '*'
    },
    'main': '',
    'license': ''
  };
}

function createEmptyPackageJsonFile(directory) {
  directory = slashDir(directory);

  var emptyPackageFile = JSON.stringify(getDummyPackageJson(), null, 2),
      deferred = q.defer();

  fs.writeFile(directory + 'package.json', emptyPackageFile, function (err) {
    if (err) deferred.reject();
    else deferred.resolve();
  });

  return deferred.promise;
}

// Helper to return a slash-trailed version of the directory name
function slashDir(directory) {
  return directory[directory.length - 1] === '/' ? directory : directory + '/';
}

module.exports = new Ya();
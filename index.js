var gux         = require('node-unique-extensions'),
    q           = require('q'),
    npmh        = require('./helpers/NpmHelper'),
    GruntHelper = require('./helpers/GruntHelper'),
    utils       = require('./helpers/Utils');

function Ya () {
  this.directory         = '.';
  this.processedPromises = [];
  this.extensions        = [];
}

Ya.prototype.init = function (directory) {
  var that = this;

  this.directory = directory || this.directory;

  this.engine = new GruntHelper(this.directory);
  this.engine.on('added', onAddedExtensions.bind(this));

  this.engine.on('jsChanged', onJSChanged.bind(this));

  npmh.hasPackageJsonFile(this.directory)
    .then(function (hasFile) {
      if (! hasFile) {
        return npmh.createEmptyPackageJsonFile(that.directory);
      }
    })
    .then(installDependencies)
    .then(getUniqueExtensions.bind(this))
    .then(getSupportedExtensions.bind(this))

    .then(function (exts) {
      if (exts.length) {
        console.log('Supported extensions found: ', exts);
        that.extensions = exts;
      }

      return exts;
    })

    .then(processSupportedExtensions.bind(this))

    .then(function (targets) {
      that.processedPromises = targets;
      return targets;
    })

    .then(function (targets) {
      var config = that.engine.getConfig(targets, that.extensions);

      console.log('Grunt configuration generated');

      return config;
    })

    .then(function (config) {
      return that.engine.flushConfig(config)
        .then(function () {
          console.log('Gruntfile.js saved to ' + that.directory);
          return config;
        });
    })

    .then(function (config) {
      return that.engine.compileTasks(config)
        .then(function () {
          console.log('Compiled existing files in ' + that.directory);
        });
    })

    .done(function () {
      that.engine.watch();
    });
};

// An extension is supported if we have a settings file for it
Ya.prototype.isExtensionSupported = function (ext) {
  var deferred = q.defer();

  if (ext) {
    return utils.exists(this.getSettingsFilepath(ext));

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

Ya.prototype.processAdditionalExtension = function (ext) {
  this.extensions.push(ext);
  this.processedPromises.push(this.processExtension(ext));

  return this.getProcessedTargets()
    .then(function (targets) {
      return this.engine.getConfig(targets, this.extensions);
    }.bind(this))

    .then(function (config) {

      return this.engine.flushConfig(config)
        .then(function () {
          return this.engine.compileTasks(config);
        }.bind(this));
    }.bind(this))

    .then(function () {
      this.engine.rewatch();
    }.bind(this))

    .done();
};

Ya.prototype.getProcessedTargets = function () {
  return q.all(this.processedPromises);
};

Ya.prototype.isExtensionAlreadyProcessed = function (ext) {
  return this.extensions.indexOf(ext) !== -1;
};

// Installs all library dependencies for that extension
// and resolves with the build engine configuration settings
// Precond: ext is a supported extension (i.e., has settings)
Ya.prototype.processExtension = function (ext) {
  return this.getExtensionSettings(ext)
    .then(function (settings) {
      // A preprocessor can require multiple libraries installed
      var libs = settings.lib instanceof Array ? settings.lib : [settings.lib];

      return q.all(libs.map(npmh.installIfNecessary.bind(npmh)))
        .then(function () {
          return settings;
        });
    });
};

///////////////
// Listeners
///////////////

// Flow for handling yet another extension on file addition
// Note: Assumes the extension is new and system-supported
function onAddedExtensions (extensions) {
  console.log('Detected the following additions: ', extensions);

  extensions.forEach(function (ext) {

    if (this.isExtensionAlreadyProcessed(ext)) return;

    this.isExtensionSupported(ext).done(function (isSupported) {
      if (! isSupported) return;

      this.processAdditionalExtension(ext);

    }.bind(this));

  }.bind(this));
}

// When to change/generate the grunt configuration
function onJSChanged(filepath) {
  if (typeof this.jsh === 'undefined') {
    var JSH = require('./helpers/JsHelper');
    this.jsh = new JSH(this.directory);
  }

  // if (this.emanager.shouldIgnore(filepath)) return;

  var that = this;
  // Cases to recompute:
  //    a root file changes: index.js could remove require of lib/index making index.js a root and lib/index a root
  //    a non-root file changes: b.js is the root and a.js changes to require b.js making it the new root
  return this.jsh.getRoots().then(function (roots) {
    console.log('Pulled roots', roots)
    console.log('old roots: ', that.jsh._oldRoots)
    return that.jsh.haveRootsChanged(roots);
  })
  .then(function (haveRootsChanged) {
    console.log('Roots changed? ', haveRootsChanged)
    if (! haveRootsChanged) {
      console.log('roots haven\'t changed');
      return;
    }
    // Need all of the targets to regenerate the gruntfile
    return that.getProcessedTargets().then(function (targets) {
      console.log('Getting config')
      return that.engine.getConfig(targets, that.extensions);
    })
    .then(function (config) {
      // Grab the targets for the apps and merge with the existing targets
      return that.jsh.getSettings().then(function (settings) {
        console.log('JS Settings: ', settings)
        console.log('JS Settings Target: ', settings.target)

        utils.shallowExtend(config, settings.target);

        console.log('Extended Config: ', config)
        return config;
      });
    })
    .then(function (config) {
      console.log('Config: ', config)
      return that.engine.flushConfig(config)
        .then(function () {
          return that.engine.compileTasks(config);
        });
    })
    // .done(function () {
    //   that.engine.watch();
    // });
  });
}

///////////////
// Helpers
///////////////

function installDependencies() {
  var dependencies = [
    'grunt',
    'grunt-cli',
    'load-grunt-tasks',
    'grunt-contrib-watch',
    'grunt-newer'
  ];

  return q.all(dependencies.map(npmh.isLibInstalled))
    .then(function (results) {
      // Only install the libs that haven't already been installed
      var notInstalled = dependencies.filter(function (dep, idx) {
        return ! results[idx];
      });

      if (notInstalled.length) {
        notInstalled.map(function (ni) {
          console.log('Installing: ', ni);
        });
      }

      return q.all(notInstalled.map(npmh.installLib));
    });
}

// Returns all extensions found in the current directory
function getUniqueExtensions() {
  return gux({
    path:            this.directory,
    exclusions:      utils.ignoredDirs,
    includeDotFiles: true
  });
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

module.exports = new Ya();
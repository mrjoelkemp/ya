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
  this.directory = directory || this.directory;

  // Lazily installed in case we want to dynamically determine
  // the build engine later on
  this.dependencies = [
    'grunt',
    'grunt-cli',
    'load-grunt-tasks',
    'grunt-contrib-watch',
    'grunt-newer'
  ];

  // Collection of folders that should be ignored so YA doesn't
  // try to process them and get all confused
  this.ignoredDirs = [
    'node_modules',
    '.git',
    '.sass-cache',
    'bower_components',
    'vendor'
  ];

  this.engine = new GruntHelper(this.directory);
  this.engine.on('added', onAddedExtensions.bind(this));
  this.engine.on('jsChanged', onJSChanged.bind(this));

  utils.bindAll(this);

  return q();
};

// Installs YA's npm dependencies
Ya.prototype.installDependencies = function () {
  var that = this;

  return q.all(this.dependencies.map(npmh.isLibInstalled))
  .then(function (results) {
    // Only install the libs that haven't already been installed
    var notInstalled = that.dependencies.filter(function (dep, idx) {
      return ! results[idx];
    });

    if (notInstalled.length) {
      notInstalled.map(function (ni) {
        console.log('Installing: ', ni);
      });
    }

    return q.all(notInstalled.map(npmh.installLib));
  });
};

// Setter to notify YA of the extensions to be used/processed
Ya.prototype.setUsedExtensions = function (extensions) {
  this.extensions = extensions || [];
};

// Creates an empty package.json file in the working directory
// to allow YA to continue initialization and installation of
// (saved) dependencies.
Ya.prototype.handleDefaultPackageJSON = function () {
  var that = this;

  return npmh.hasPackageJsonFile(this.directory)
  .then(function (hasFile) {
    if (! hasFile) {
      return npmh.createEmptyPackageJsonFile(that.directory);
    }
  });
};

// Initiates the build engine's watch task
Ya.prototype.watch = function () {
  this.engine.watch();
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

Ya.prototype.processExtensions = function () {
  return q.all(this.extensions.map(this.processExtension));
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

// Adds the new extension to the processing pipeline and regenerates
// the build engine configuration
Ya.prototype.processAdditionalExtension = function (ext) {
  var that = this;

  this.extensions.push(ext);
  this.processedPromises.push(this.processExtension(ext));

  return this.generateConfig()
    .then(function (config) {
      return that.engine.flushConfig(config)
        .then(function () {
          return that.engine.compileTasks(config);
        });
    })

    .then(function () {
      that.engine.rewatch();
    })

    .done();
};

// Returns true if the given extension has already been processed
Ya.prototype.isExtensionAlreadyProcessed = function (ext) {
  return this.extensions.indexOf(utils.dotExt(ext)) !== -1;
};

// Returns all extensions found in the current directory
Ya.prototype.findUsedExtensions = function () {
  return gux({
    path:            this.directory,
    exclusions:      utils.ignoredDirs,
    includeDotFiles: true
  });
};

// Returns a subset of the given extensions that YA supports
Ya.prototype.filterSupportedExtensions = function (extensions) {
  return q.all(extensions.map(this.isExtensionSupported.bind(this)))
  .then(function (results) {

    // Grab all extensions that have a truthy support value
    var supported = extensions.filter(function (ext, idx) {
      return results[idx];
    });

    return supported;
  });
};

// Resolves with the build engine configuration for all
// processed extensions
Ya.prototype.generateConfig = function () {
  return this.getAllSettings()
    .then(function (targets) {
      return this.engine.getConfig(targets, this.extensions);
    }.bind(this));
};

// Flushes the build engine configuration to disk
Ya.prototype.flushConfig = function (config) {
  return this.engine.flushConfig(config);
};

Ya.prototype.compileTasks = function (config) {
  return this.engine.compileTasks(config);
};

// Returns a list of promises that resolve with the
// settings objects of all processed extensions
Ya.prototype.getAllSettings = function () {
  return q.all(this.processedPromises);
};

// Sets the list of processed extensions' settings
Ya.prototype.setAllSettings = function (settingsList) {
  this.processedPromises = settingsList;
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
function onJSChanged() {
  if (typeof this.jsh === 'undefined') {
    var JSH = require('./helpers/JsHelper');
    this.jsh = new JSH(this.directory);
  }

  var that = this;
  // Cases to recompute:
  //    a root file changes: index.js could remove require of lib/index making index.js a root and lib/index a root
  //    a non-root file changes: b.js is the root and a.js changes to require b.js making it the new root
  return this.jsh.getRoots().then(function (roots) {
    // console.log('Pulled roots', roots, '\nold roots: ', that.jsh._oldRoots)
    return that.jsh.haveRootsChanged(roots);
  })
  .then(function (haveRootsChanged) {

    if (! haveRootsChanged) {
      console.log('roots haven\'t changed');
      return;
    }

    console.log('An app root has changed');

    // Need all of the targets to regenerate the gruntfile
    return that.getAllSettings().then(function (targets) {
      // console.log('Getting config')
      return that.engine.getConfig(targets, that.extensions);
    })
    .then(function (config) {
      // Grab the targets for the apps and merge with the existing targets
      return that.jsh.getSettings().then(function (settings) {
        // console.log('JS Settings: ', settings)
        // console.log('JS Settings Target: ', settings.target)

        utils.shallowExtend(config, settings.target);

        // console.log('Extended Config: ', config)
        return config;
      });
    })
    .then(function (config) {
      // console.log('Config: ', config)
      return that.engine.flushConfig(config)
        .then(function () {
          return that.engine.compileTasks(config);
        });
    });
  });
}

module.exports = new Ya();
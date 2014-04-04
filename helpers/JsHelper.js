var utils         = require('../helpers/Utils'),
    getRoots      = require('app-root'),
    q             = require('q'),
    getModuleType = require('module-definition'),
    path          = require('path');

// Generate browserify/requirejs configurations based on
// the root files in the managed directory

function JSH (directory) {
  this.directory = directory;

  this._oldRoots = [];
}

module.exports = JSH;

// Resolves with the JS extension targets appropriate to the
// apps in the working directory
JSH.prototype.getSettings = function () {
  var that = this;
  return this.getRoots().then(function (roots) {
    console.log('Fetched roots', roots)
    return q.all(roots.map(that.getModuleType.bind(that)))
      .then(function (moduleTypes) {
        return that.generateSettings(roots, moduleTypes);
      });
  });
};

JSH.prototype.haveRootsChanged = function (roots) {
  if (! utils.areArraysEqual(this._oldRoots, roots)) {
    this._oldRoots = roots;
    return true;
  }

  return false;
};

// Returns the JS extension settings for all roots/apps
// within the working directory
// Notes:
//    Apps could have different module definition types (commonjs or amd)
//    There could be multiple apps in a working directory
JSH.prototype.generateSettings = function (roots, moduleTypes) {
  var browserifyTargets = {},
      requireJSTargets = {},
      allTargets       = {},
      libs             = [],
      that             = this;

  // Generate a target per root (targets could use
  // different settings if they're using different module types)
  roots.forEach(function (root, idx) {
    var moduleType  = moduleTypes[idx],
        relRoot     = path.relative(that.directory, root),
        target      = that.getTargetForRoot(relRoot, moduleType);

    console.log('Found the ' + moduleType + ' app root: ' + relRoot);

    if (moduleType === 'commonjs') {
      browserifyTargets['t' + idx] = target;

    } else if (moduleType === 'amd') {
      requireJSTargets['t' + idx] = target;
    }
  });

  // Compile all targets into one
  if (! utils.isEmptyObject(browserifyTargets)) {
    allTargets.browserify = {};
    utils.shallowExtend(allTargets.browserify, browserifyTargets);
    libs.push('grunt-browserify');
  }

  if (! utils.isEmptyObject(requireJSTargets)) {
    allTargets.requirejs = {};
    utils.shallowExtend(allTargets.requirejs, requireJSTargets);
    libs.push('grunt-contrib-requirejs');
  }

  return {
    lib: libs,
    target: allTargets
  };
};

// Resolves with the roots for the working directory
// Based on node-app-root
JSH.prototype.getRoots = function () {
  var deferred = q.defer(),
      options = {
        ignoreDirectories: utils.ignoredDirs,
        // Don't want a config for the bundle
        ignoreFiles: ['Gruntfile.js', /.*(-bundle.js)/]
      };

  getRoots(this.directory, options, function (roots) {
    deferred.resolve(roots);
  });

  return deferred.promise;
};

// Resolves with the module type of the given file
// Based on node-module-definition
JSH.prototype.getModuleType = function (file) {
 var deferred = q.defer();

  getModuleType(file, function (moduleType) {
    deferred.resolve(moduleType);
  });

  return deferred.promise;
};

// Returns the grunt configuration target appropriate for the
// root's module type
JSH.prototype.getTargetForRoot = function (root, moduleType) {
  var fileName = path.basename(root, '.js'),
      ext = '-bundle.js';

  switch(moduleType) {
    case 'commonjs':
      return {
        // Root goes here
        src: [root],
        // Dest goes here
        dest: fileName + '-b' + ext
      };
    case 'amd':
      return {
        options: {
          baseUrl:  this.directory,
          out:      fileName + '-r' + ext,
          include:  root,
          wrap:     true,
          optimize: 'none'
        }
      };
  }
};
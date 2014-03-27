var q = require('q'),
    utils = require('../helpers/Utils'),
    gr    = require('app-root'),
    gmt   = require('module-definition'),
    path  = require('path');

// Generate browserify/requirejs configurations based on
// the root files in the managed directory
var directory = process.argv[2] || '.';

module.exports = getRoots(directory)
  .then(function (roots) {
    return q.all(roots.map(getModuleType))
      .then(function (moduleTypes) {
        var browserifyTargets = {},
            requireJSTargets  = {},
            allTargets        = {},
            libs              = [];

        // Generate a target per root (targets could use
        // different settings if they're using different module types)
        roots.forEach(function (root, idx) {
          var moduleType  = moduleTypes[idx],
              relRoot     = path.relative(directory, root),
              target      = getTargetForRoot(relRoot, moduleType);

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
      });
  });

// Promisified app-root
function getRoots(directory) {
  var deferred = q.defer(),
      options = {
        ignoreDirectories: utils.ignoredDirs,
        // Don't want a config for the bundle
        ignoreFiles: ['Gruntfile.js', /.*(-bundle.js)/]
      };

  gr(directory, options, function (roots) {
    deferred.resolve(roots);
  });

  return deferred.promise;
}

// Promsified module-definition
function getModuleType (file) {
  var deferred = q.defer();

  gmt(file, function (moduleType) {
    deferred.resolve(moduleType);
  });

  return deferred.promise;
}

// TODO: If two roots of the same type have the same name
// within different dirs they'll overwrite each other
function getTargetForRoot(root, moduleType) {
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
          baseUrl:  directory,
          out:      fileName + '-r' + ext,
          include:  root,
          wrap:     true,
          optimize: 'none'
        }
      };
  }
}

// On the addition of the .js extension (the first time you create a JS file) config will be empty

// When a JS file changes
  // You should recompute the roots when:
    // a root file changes (possibly it removes key dependencies that make it one of many roots; ex: index.js removing ref to lib/)
    // a root file gets deleted
  // set the old roots to the new roots (bind to the injected grunt object)
  // refresh the configuration

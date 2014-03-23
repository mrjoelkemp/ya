var q = require('q'),
    npmh = require('../helpers/NpmHelper'),
    utils = require('../helpers/Utils');

// Install dependencies
return q.all(['app-root', 'module-definition'].map(npmh.installIfNecessary.bind(npmh)))
  .then(init);

function init() {

  // Find all roots in the working directory
  return getRoots()
    .then(function (roots) {
      return q.all(roots.map(getModuleType))
        .then(function (moduleTypes) {
          var browserifyTargets = {},
              requireJSTargets = {};

          // Generate a target per root (targets could use different settings if they're using different module types)
          roots.forEach(function (root, idx) {
            var moduleType = moduleTypes[idx];
            var target = getTargetForRoot(root, moduleType);
            if (moduleType === 'commonjs') {
              browserifyTargets['t' + idx] = target;

            } else {
              requireJSTargets['t' + idx] = target;
            }
          });

          return targets;
        });
    });
}

// Promisified app-root
function getRoots() {
  var gr = require('app-root');

  var deferred = q.defer(),
      options = {
        ignore: utils.ignoredDirs
      };

  gr(process.argv[2] || '.', options, function (roots) {
    deferred.resolve(roots);
  });

  return deferred.promise;
}

// Promsified module-definition
function getModuleType (file) {
  var gmt = require('module-definition');

  var deferred = q.defer();

  gmt(file, function (moduleType) {
    deferred.resolve(moduleType);
  });

  return deferred.promise;
}

function getTargetForRoot(root, moduleType) {
  var outExt = '.bundle.js';

  switch(moduleType) {
    case 'commonjs':
      return {
        // Root goes here
        src: [root],
        // Dest goes here
        dest: root + outExt
      };
    case 'amd':
      return {
        // Root goes here
        mainConfigFile: root,
        // Dest goes here
        out: root + outExt
      };
  }
}

// Target should be the browserify or r.js configuration
var browserifySettings = {
  targetName: 'browserify',
  lib: 'grunt-browserify',
  target: {
    dist: {
      // Root goes here
      src: [],
      // Dest goes here
      dest: ''
    }
  }
},

requirejsSettings = {
  targetName: 'requirejs',
  lib: 'grunt-contrib-requirejs',
  target: {
    dist: {
      // Root goes here
      mainConfigFile: '',
      // Dest goes here
      out: ''
    }
  }
};

// On the addition of the .js extension (the first time you create a JS file) config will be empty

// When a JS file changes
  // You should recompute the roots when:
    // a root file changes (possibly it removes key dependencies that make it one of many roots; ex: index.js removing ref to lib/)
    // a root file gets deleted
  // set the old roots to the new roots (bind to the injected grunt object)
  // refresh the configuration

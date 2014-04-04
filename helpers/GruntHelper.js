var fs           = require('fs'),
    q            = require('q'),
    exec         = require('child_process').exec,
    EventEmitter = require('events').EventEmitter,
    util         = require('util'),
    utils        = require('./Utils');

module.exports = function (directory) {
  EventEmitter.call(this);
  this.directory  = directory;

  this.ignoreWatchDirectories = utils.ignoredDirs;
};

util.inherits(module.exports, EventEmitter);

module.exports.prototype.ignoreDirectory = function (directory) {
  if (directory && this.ignoreWatchDirectories.indexOf(directory) === -1) {
    this.ignoreWatchDirectories.push(directory);
  }
};

// Takes in the list of settings per supported/found extension
// and returns the grunt configuration object
// Precond: extensions = the currently processed list of extensions
// Note: We need the raw extensions passed in since the targets
//    could names aren't always indicative of the extension (ex: sass)
module.exports.prototype.getConfig = function (targets, extensions) {
  var compileConfig = this.getCompileConfig(targets),
      watchConfig   = this.getWatchConfig(compileConfig, extensions);

  return watchConfig;
};

// Precond: targets is a list of target/object definitions for each
// supported preprocessor
module.exports.prototype.getCompileConfig = function (targets) {
  var gruntConfig = {};

  // Merge all of the configurations with the target name
  // being the preprocessor extension, without the leading period
  targets.forEach(function (target) {
    // Merge gruntConfig with target
    for (var key in target.target) {
      gruntConfig[key] = target.target[key];
    }

  });

  return gruntConfig;
};

// Attaches the watch configuration to the passed grunt configuration
module.exports.prototype.getWatchConfig = function (gruntConfig, extensions) {
  var watchConfig = {};

  // Watch the files for handled extensions
  Object.keys(gruntConfig).forEach(function (target, idx) {
    var currentExt = extensions[idx];

    // TODO: This should likely be a per-extension setting config
    var extShouldUseNewer = [
      '.scss',
      '.slim',
      '.less',
      '.styl',
      '.jsx',
      '.coffee',
      '.jade',
      '.jshintrc'
    ];

    watchConfig[target] = {
      files: ['**/*' + currentExt].concat(this.getIgnoredDirectories(currentExt)),
      // Execute the compile task for the given extension (its target name)
      tasks: [target]
    };

    // Special case to avoid watching the js bundle
    if (currentExt === '.js') watchConfig[target].files.push('!*.bundle.js');

    // Use grunt-newer
    if (extShouldUseNewer.indexOf(currentExt) !== -1) {
      watchConfig[target].tasks[0] = 'newer:' + target;
    }

  }.bind(this));

  // Watch the directory for file additions
  watchConfig['all'] = {
    files: ['**/*'].concat(this.getIgnoredDirectories()),
    tasks: ['noop'],
    options: {
      // https://github.com/gruntjs/grunt-contrib-watch/issues/166
      cwd: this.directory + '/',
      spawn: false,
      event: ['added']
    }
  };

  // The watch config is a field of the main grunt config
  gruntConfig.watch = watchConfig;

  return gruntConfig;
};

// Returns a list of strings specifying folders for grunt to ignore
// Note: Uses the exclamation point ignore syntax
// @param {String} [ext] Appended to the ignore strings
module.exports.prototype.getIgnoredDirectories = function (ext) {
  ext = ext || '';

  return this.ignoreWatchDirectories.map(function (dir) {
    return '!' + utils.slashDir(dir) + '**/*' + ext;
  });
};

// Writes the Gruntfile.js file in the current directory with the given config
// Resolves with the given config for convenience
module.exports.prototype.flushConfig = function (config) {
  if (! config) throw new Error('Grunt config cannot be empty');

  var deferred = q.defer(),
      dirName  = utils.slashDir(this.directory),
      gruntDef = generateGruntfile(config);

  // Substitute the generated configuration
  gruntDef = gruntDef.toString().replace('generatedConfig', JSON.stringify(config, null, 2));
  gruntDef = 'module.exports = ' + gruntDef;

  // Write file to the current directory
  fs.writeFile(dirName + 'Gruntfile.js', gruntDef, function (err) {
    if (err) {
      console.log('Error writing Gruntfile: ', err);
      deferred.reject(err);

    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;
};

// Helper that returns a function whose body represents
// a gruntfile definition
function generateGruntfile (generatedConfig) {
  return function(grunt) {
    var path = require('path'),
        fs = require('fs');

    require('load-grunt-tasks')(grunt);

    grunt.initConfig(generatedConfig);

    grunt.registerTask('default', ['watch']);

    // Handle new files with that have a new, supported preprocessor
    grunt.event.on('watch', function(action, filepath) {
      if (action !== 'added') return;

      var ext = path.extname(filepath);

      // Ignore directories
      if (fs.lstatSync(filepath).isDirectory()) return;

      // This is a special message that's parsed by Mule
      // to determine if support for an additional preprocessor is necessary
      // Note: this allows us to avoid controlling grunt manually within Mule
      console.log('EXTADDED:' + ext);
    });

    // For watching entire directories but allowing
    // the grunt.event binding to take care of it
    grunt.registerTask('noop', function () {});
  };
}

// Runs the given grunt task, or simply 'grunt' (the default task) if not supplied
// Resolve when done
module.exports.prototype.runTask = function (taskName) {
  var d = q.defer(),
      cmd = taskName ? 'grunt ' + taskName : 'grunt',
      child;

  child = exec(cmd, function(err, stdout) {
    console.log(stdout);

    if (err) {
      console.log('Error running ' + cmd + ': ', err);
      d.reject(err);
    } else {
      console.log('Ran ' + cmd);
      d.resolve();
    }
  });

  child.stdout.on('data', function(data) {
    // relay output to console
    console.log(data);
  });

  return d.promise;
};

// Triggers grunt's watch task
// Note: We don't use runTask to get access to the child process
module.exports.prototype.watch = function () {
  // Prevent multiple watch calls
  if (this.watchChild) return;

  console.log('Starting grunt watch');

  var d = q.defer(),
      child;

  child = exec('grunt watch', function(err, stdout) {
    console.log(stdout);

    if (err) {
      d.reject(err);
    } else {
      d.resolve();
    }
  });

  child.stdout.on('data', function(data) {
    // Check for the extension added flag
    var pattern = /(EXTADDED:)(\.[a-zA-Z]+)/g,
        matches = [],
        match;

    // Grab all added extensions
    while (match = pattern.exec(data)) {
      matches.push(match[2]);
    }

    if (matches.length) {
      this.emit('added', matches);
    }

    // Remove the flag from the output
    console.log(data.replace(pattern, ''));

  }.bind(this));

  this.watchChild = child;

  return d.promise;
};

// Restarts the existing watch process
module.exports.prototype.rewatch = function () {
  var cb = function () {
    this.watchChild = null;
    this.watch();
  }.bind(this);

  // Kill the existing watch
  if (this.watchChild) {
    this.watchChild.on('close', cb);

    this.watchChild.kill('SIGHUP');
  } else {
    cb();
  }
};

// Triggers the compile tasks to precompile any existing files
// Precond: the configuration object supplied to grunt's initConfig
module.exports.prototype.compileTasks = function (config) {
  if (! config) throw new Error('config empty for compile');

  var targets = Object.keys(config);

  // Remove watch
  targets.splice(targets.indexOf('watch'), 1);

  return q.all(targets.map(this.runTask));
};
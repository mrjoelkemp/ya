var fs           = require('fs'),
    q            = require('q'),
    exec         = require('child_process').exec,
    EventEmitter = require('events').EventEmitter,
    util         = require('util');

module.exports = function (directory) {
  EventEmitter.call(this);
  this.directory  = directory;
};

util.inherits(module.exports, EventEmitter);

// Takes in the list of settings per supported/found extension
// and returns the grunt configuration object
// Precond: extensions = the currently processed list of extensions
// Note: We need the raw extensions passed in since the targets
//    could names aren't always indicative of the extension (ex: sass)
module.exports.prototype.getConfig = function (targets, extensions) {
  var compileConfig = this.getCompileConfig(targets, extensions),
      watchConfig   = this.getWatchConfig(compileConfig, extensions);

  return watchConfig;
};

// Precond: targets is a list of target/object definitions for each
// supported preprocessor
module.exports.prototype.getCompileConfig = function (targets, extensions) {
  var gruntConfig = {};

  // Merge all of the configurations with the target name
  // being the preprocessor extension, without the leading period
  targets.forEach(function (target, idx) {
    var curExt    = extensions[idx],
        extension = curExt[0] === '.' ? curExt.slice(1) : curExt;

    // Use the alternate name for special cases
    gruntConfig[target.targetName || extension] = target.target;

  }.bind(this));

  return gruntConfig;
};

// Attaches the watch configuration to the passed grunt configuration
module.exports.prototype.getWatchConfig = function (gruntConfig, extensions) {
  var watchConfig = {};

  // Watch the files for handled extensions
  Object.keys(gruntConfig).forEach(function (target, idx) {
    watchConfig[target] = {
      files: ['**/*' + extensions[idx], '!node_modules/**/*' + extensions[idx]],
      // Execute the compile task for the given extension (its target name)
      tasks: [target]
    };

  }.bind(this));

  // Watch the directory for file additions
  watchConfig['all'] = {
    files: ['**/*', '!node_modules/**/*'],
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

// Writes the Gruntfile.js file in the current directory with the given config
// Resolves with the given config for convenience
module.exports.prototype.flushConfig = function (config) {
  if (! config) throw new Error('Grunt config cannot be empty');

  var deferred = q.defer(),
      dirName  = this.directory[this.directory.length - 1] === '/' ? this.directory : this.directory + '/',
      gruntDef = require('./generateGruntfile')(config);

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

  return d.promise;
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
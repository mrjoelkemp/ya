#!/usr/bin/env node

'use strict';

var ya = require('../');

// TODO: Support an output directory from the command line

// Input directory defaults to current directory (.) if not supplied
process.argv[2] = process.argv[2] || '.';

ya.init(process.argv[2])
.then(ya.handleDefaultPackageJSON)
.then(ya.installDependencies)

.then(function () {
  console.log('YA dependencies resolved');
})

.then(ya.findUsedExtensions)

.then(function (extensions) {
  console.log('Found the extensions: ', extensions);
  return extensions;
})

.then(ya.filterSupportedExtensions)

.then(function (extensions) {
  console.log('Processing these extensions: ', extensions);
  return extensions;
})

.then(ya.setUsedExtensions)
.then(ya.processExtensions)
.then(ya.setAllSettings)
.then(ya.generateConfig)

.then(function (config) {
  return ya.flushConfig(config).then(function () {
    return ya.compileTasks(config);
  });
})

.then(ya.watch);

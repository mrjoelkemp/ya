#!/usr/bin/env node

'use strict';

var ya = require('../');

// TODO: Support an output directory from the command line

ya.init(process.argv[2])
  .done(function () {
    ya.watch();
  });

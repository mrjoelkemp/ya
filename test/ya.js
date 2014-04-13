var expect = require('expect.js'),
    temp       = require('temporary'),
    File       = temp.File,
    Dir        = temp.Dir,
    mocha      = require('mocha'),
    beforeEach = mocha.beforeEach,
    before     = mocha.before,
    after      = mocha.after,
    afterEach  = mocha.afterEach,
    fs         = require('fs'),
    ya         = require('../');

describe('YA', function() {
  var dir, yaInit, file;

  before(function () {
    dir  = new Dir();
    yaInit = ya.init(dir.path);
  });

  after(function () {
    dir.rmdir();
  });

  it('generates an empty package.json file if it doesn\'t exist in the target dir', function (done) {
    yaInit.then(function () {
      fs.exists(dir.path + '/package.json', function (exists) {
        expect(exists).to.be.ok();
        done();
      });
    });
  });
});
var expect = require('expect.js'),
    temp           = require('temporary'),
    File           = temp.File,
    Dir            = temp.Dir,
    mocha          = require('mocha'),
    beforeEach     = mocha.beforeEach,
    before         = mocha.before,
    after          = mocha.after,
    afterEach      = mocha.afterEach,
    fs             = require('fs'),
    ya             = require('../');

function shouldEventuallyProduceFile(filename, doneCallback) {
  // This can be gathered from producing an equivalent css file
  // We want to check that compilation happens, not test the compilation
  (function checkForFile() {
    setTimeout(function () {
      fs.exists(filename, function (exists) {
        if (exists) {
          doneCallback();
        }
        else checkForFile();
      });
    }, 100);
  })();
}

describe('YA', function() {
  describe('Fresh directory usage', function () {
    var dir;

    before(function () {
      dir  = new Dir();
    });

    after(function () {
      dir.rmdir();
    });

    it('generates an empty package.json file if it doesn\'t exist in the target dir', function (done) {
      ya
      .init(dir.path)
      .then(ya.handleDefaultPackageJSON)
      .then(function () {
        fs.exists(dir.path + '/package.json', function (exists) {
          expect(exists).to.be.ok();
          done();
        });
      });
    });
  });

  describe('Dirty directory usage', function () {
    var
        dir,
        samplesass = 'body { color: blue; h1 { color: red; }}',
        samplepjson = { name: 'hi' };

    before(function () {
      dir  = new Dir();

      // Init test file for package.json generation
      fs.writeFileSync(dir.path + '/package.json', '');

      // Init test files to test precompilation
      fs.writeFileSync(dir.path + '/styles.scss', samplesass);
    });

    after(function () {
      dir.rmdir();
    });

    it('does not generate a package.json file is one already exists', function (done) {
      ya
      .init(dir.path)
      .then(ya.handleDefaultPackageJSON)
      .then(function () {
        var contents = fs.readFileSync(dir.path + '/package.json').toString();
        expect(contents).to.equal('');
        done();
      });
    });

    it.skip('compiles all sass files in the directory', function (done) {
      this.timeout(60000);

      ya
      .init(dir.path)
      .then(ya.startup)
      .then(ya.yaExtensions)
      .then(ya.generateBuildConfig)
      .then(ya.compileTasks)
      .then(function () {
        shouldEventuallyProduceFile(dir.path + 'styles.css', done);
      });
    });

    it.skip('generates a Gruntfile.js file', function () {

    });
  });
});

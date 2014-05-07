var
    expect     = require('expect.js'),
    mocha      = require('mocha'),
    fs         = require('fs'),
    q          = require('q'),

    beforeEach = mocha.beforeEach,
    before     = mocha.before,
    after      = mocha.after,
    afterEach  = mocha.afterEach,

    ya         = require('../'),
    npmh       = require('../helpers/NpmHelper');

/**
 * Stub replacement for node-temporary since we want
 * all tests to run about the sandbox directory
 * @type {Object}
 */
var dir = {
  path: './sandbox'
};

var
    pjsonPath = dir.path + '/package.json',
    sassPath = dir.path + '/styles.scss',
    gruntfilePath = dir.path + '/Gruntfile.js',
    nodeModulesPath = dir.path + '/node_modules';


ya.init(dir.path);


/**
 * Checks for the eventual existence of the given file
 * @param  {String} filename The file that should eventually be created
 * @param  {Function} doneCallback Executed when the file exists
 */
function shouldEventuallyProduceFile(filename, doneCallback) {
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

/**
 * Synchronously removes the directory, if it exists
 * @param  {String} dirname The directory to delete
 */
function removeDir(dirname) {
  if (fs.existsSync(dirname)) {
    fs.rmdirSync(dirname);
  }
}

/**
 * Synchonously unlinks the path, if it exists
 * @param  {String} path The path (file/dir/symlink) to unlink
 */
function unlink(path) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
}


describe('YA', function() {
  // Make sandbox directory (if exists)
  fs.mkdirSync(dir.path);

  // Symlink for access to the grunt plugins
  fs.symlinkSync('../node_modules', dir.path + '/node_modules', 'dir');
  // Need this for load-grunt-tasks
  fs.symlinkSync('../package.json', dir.path + '/package.json', 'file');

  describe('Fresh directory usage', function () {
    after(function () {
      unlink(pjsonPath);
      unlink(gruntfilePath);
    });

    it('generates an empty package.json file if it doesn\'t exist in the target dir', function (done) {
      var tmp = dir.path + '/tmp';

      // Since the package.json is symlinked, create a tmp dir
      fs.mkdirSync(tmp);

      ya.init(tmp);

      q()
      .then(ya.handleDefaultPackageJSON)
      .then(function () {
        fs.exists(tmp + '/package.json', function (exists) {
          expect(exists).to.be.ok();
          // Reset the working directory
          ya.init(dir.path);
          unlink(tmp + '/package.json');
          removeDir(tmp);
          done();
        });
      });
    });

    it('still generates a Gruntfile.js file', function (done) {
      q()
      .then(ya.yaExtensions)
      .then(ya.generateBuildConfig)
      .then(function () {
        shouldEventuallyProduceFile(gruntfilePath, function () {
          unlink(gruntfilePath);
          done();
        });
      });
    });
  });

  describe('Dirty directory usage', function () {
    after(function () {
      unlink(sassPath);
    });

    it('does not generate a package.json file is one already exists', function (done) {
      q()
      .then(ya.handleDefaultPackageJSON)
      .then(function () {
        // Ya should not have changed the package.json contents
        var current = fs.readFileSync(pjsonPath).toString(),
            dummy = JSON.stringify(npmh.getDummyPackageJson());

        expect(current).not.to.equal(dummy);
        done();
      });
    });

    describe('Preprocessors', function () {
      after(function () {
        unlink(dir.path + '/styles.css');
        unlink(dir.path + '/test.js');
      });

      /**
       * Helper to test preprocessor compilation
       * Expects the this context to be Mocha's 'it'
       * @param  {String}   file An empty preprocessor file to create
       * @param  {String}   into The filepath that should eventually get created
       * @param  {Function} done The callback to execute when the into file is created
       */
      function shouldCompile(file, into, done) {
        this.timeout(10000);

        fs.writeFileSync(file, '');

        q()
        .then(ya.startup)
        .then(ya.yaExtensions)
        .then(ya.generateBuildConfig)
        .then(function (config) {
          // grunt (or grunt-load-tasks) will fail unless we're in the sandbox
          process.chdir(dir.path);

          return config;
        })
        .then(ya.compileTasks)
        .then(function () {
          process.chdir('../');
          shouldEventuallyProduceFile(into, done);
        });
      }

      it('compiles sass', function (done) {
        shouldCompile.call(this, sassPath, dir.path + '/styles.css', done);
      });

      it('compiles coffeescript', function (done) {
        shouldCompile.call(this, dir.path + '/test.coffee', dir.path + '/test.js', done);
      });

      it('compiles jade', function (done) {
        shouldCompile.call(this, dir.path + '/test.jade', dir.path + '/test.html', done);
      });

      it.skip('compiles jsx', function (done) {
        shouldCompile.call(this, dir.path + '/react.jsx', dir.path + '/react.js', done);
      });

      it('compiles less', function (done) {
        shouldCompile.call(this, dir.path + '/test.less', dir.path + '/test.css', done);
      });

      it('compiles slim', function (done) {
        shouldCompile.call(this, dir.path + '/fat.slim', dir.path + '/fat.html', done);
      });

      it.skip('compiles compass');

      it('compiles stylus', function (done) {
        shouldCompile.call(this, dir.path + '/stylus.styl', dir.path + '/stylus.css', done);
      });

      it('compiles typescript', function (done) {
        shouldCompile.call(this, dir.path + '/type.ts', dir.path + '/type.js', done);
      });
    });

    // TODO: need to test that the addition of new files while YA is running
    // will still compile as needed

    describe('Build Tooling', function () {
      it.skip('browserifies a commonjs app');
      it.skip('r.js compiles an amd app');
      it.skip('jshints all js files');
    });
  });
});

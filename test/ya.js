var
    expect     = require('expect.js'),
    mocha      = require('mocha'),
    fs         = require('fs'),
    beforeEach = mocha.beforeEach,
    before     = mocha.before,
    after      = mocha.after,
    afterEach  = mocha.afterEach,
    ya         = require('../'),
    q          = require('q');

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
 * Synchronously removes the file if it exists
 * @param  {String} filename The file to delete
 */
function removeFile(filename) {
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }
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
    fs.unlink(path);
  }
}


describe('YA', function() {
  // Remove symlinks
  unlink(nodeModulesPath);
  unlink(pjsonPath);

  // Destroy sanbox directory (if exists)
  removeDir(dir.path);
  fs.mkdirSync(dir.path);

  // Symlink the node_modules folder
  fs.symlinkSync('../node_modules', dir.path + '/node_modules', 'dir');
  fs.symlinkSync('../package.json', dir.path + '/package.json', 'file');

  describe('Fresh directory usage', function () {
    after(function () {
      removeFile(pjsonPath);
      removeFile(gruntfilePath);
    });

    it('generates an empty package.json file if it doesn\'t exist in the target dir', function (done) {
      q()
      .then(ya.handleDefaultPackageJSON)
      .then(function () {
        fs.exists(pjsonPath, function (exists) {
          expect(exists).to.be.ok();
          done();
        });
      });
    });

    it('still generates a Gruntfile.js file', function (done) {
      q()
      .then(ya.yaExtensions)
      .then(ya.generateBuildConfig)
      .then(function () {
        shouldEventuallyProduceFile(gruntfilePath, done);
      });
    });
  });

  describe('Dirty directory usage', function () {
    var
        samplesass = 'body { color: blue; h1 { color: red; }}',
        samplepjson = { name: 'hi' };

    after(function () {
      removeFile(pjsonPath);
      removeFile(sassPath);
    });

    it('does not generate a package.json file is one already exists', function (done) {
      fs.writeFileSync(pjsonPath, '');

      q()
      .then(ya.handleDefaultPackageJSON)
      .then(function () {
        var contents = fs.readFileSync(pjsonPath).toString();
        expect(contents).to.equal('');
        done();
      });
    });

    it.skip('compiles all sass files in the directory', function (done) {
      fs.writeFileSync(sassPath, samplesass);

      q()
      .then(ya.startup)
      .then(ya.yaExtensions)
      .then(ya.generateBuildConfig)
      .then(ya.compileTasks)
      .then(function () {
        shouldEventuallyProduceFile(dir.path + 'styles.css', done);
      });
    });
  });
});

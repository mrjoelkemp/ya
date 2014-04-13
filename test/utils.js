var expect = require('expect.js'),
    utils = require('../helpers/Utils'),
    fs = require('fs');

describe('Utils', function () {
  describe('slashDir', function() {
    it('adds a trailing slash if not there', function () {
      expect(utils.slashDir('.')).to.equal('./');
      expect(utils.slashDir('/foo')).to.equal('/foo/');
      expect(utils.slashDir('/foo/')).to.equal('/foo/');
      expect(utils.slashDir('/foo/bar')).to.equal('/foo/bar/');
    });

    it('returns an empty string if given an empty string', function () {
      expect(utils.slashDir('')).to.equal('');
    });
  });

  describe('exists', function() {
    it('returns a promise', function () {
      expect(utils.exists('../index.js').then).to.be.an('function');
    });

    it('resolves with the results of fs.exists', function () {
      var file = '../index.js';
      fs.exists(file, function (exists) {
        utils.exists(file).done(function (e) {
          expect(e).to.equal(exists);
        });
      });
    });
  });

  describe('shallow extend', function() {
    it('copies methods from obj2 to obj1', function () {
      var obj1 = {},
          obj2 = {
            foo: function () {}
          };
      utils.shallowExtend(obj1, obj2);

      expect(obj1.foo).to.be.an('function');
    });

    it('obj1 shares a reference to attached objects on obj2', function () {
      var obj1 = {},
          obj2 = {
            foo: {
              bar: 1
            }
          };

      utils.shallowExtend(obj1, obj2);

      expect(obj1.foo).to.equal(obj2.foo);
    });
  });

  describe('isEmptyObject', function() {
    it('returns true if the given object has no properties', function () {
      expect(utils.isEmptyObject({})).to.be.ok();
    });

    it('returns false if the given object has properties', function () {
      expect(utils.isEmptyObject({ foo: 1 })).to.not.be.ok();
    });
  });

  describe('areArraysEqual', function() {
    it('returns true if the arrays have the same length and each value at every index is the same between both arrays', function () {
      expect(utils.areArraysEqual([1,2,3], [1,2,3])).to.be.ok();
      expect(utils.areArraysEqual([1], [1])).to.be.ok();
      expect(utils.areArraysEqual([], [])).to.be.ok();
    });

    it('returns false if the arrays have different lengths', function () {
      expect(utils.areArraysEqual([1,3], [1,2,3])).to.not.be.ok();
      expect(utils.areArraysEqual([1], [])).to.not.be.ok();
    });

    it('returns false if the arrays do not have the same values at the same index across arrays', function () {
      expect(utils.areArraysEqual([1,4,3], [1,2,3])).to.not.be.ok();
      expect(utils.areArraysEqual([1], [2])).to.not.be.ok();
    });

    it('throws an error if any of the arguments are non-arrays', function () {
      expect(function () { utils.areArraysEqual([1,4,3], {}) }).to.throwError();
    });
  });
});
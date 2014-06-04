/**
 * The grunt library used to process this extension
 * @type {String}
 */
module.exports.lib = 'grunt-contrib-coffee';

/**
 * Whether or not this extension uses grunt-newer
 * @type {Boolean}
 */
module.exports.useNewer = true;

/**
 * The Gruntfile configuration for this extension
 * @type {Object}
 */
module.exports.target = {
  coffee: {
    dist: {
      files: [{
        expand: true,
        src: ['**/*.coffee', '!node_modules/**/*.coffee'],
        ext: '.js'
      }]
    }
  }
};
module.exports.lib = 'grunt-contrib-less';
module.exports.useNewer = true;
module.exports.target = {
  less: {
    dist: {
      files: [{
        expand: true,
        src: ['**/*.less', '!node_modules/**/*.less'],
        ext: '.css'
      }]
    }
  }
};
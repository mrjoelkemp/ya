module.exports.lib = 'grunt-react';
module.exports.target = {
  jsx: {
    dist: {
      files: [{
        expand: true,
        src: ['**/*.jsx', '!node_modules/**/*.jsx'],
        ext: '.js'
      }]
    }
  }
};
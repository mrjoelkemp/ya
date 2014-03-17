// Collection of little utility helpers

// Helper to return a slash-trailed version of the directory name
module.exports.slashDir = function (directory) {
  return directory[directory.length - 1] === '/' ? directory : directory + '/';
};
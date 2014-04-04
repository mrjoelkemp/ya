var JSH = require('../helpers/JsHelper');

var jsh = new JSH(process.argv[2] || '.');

module.exports = jsh.getSettings();
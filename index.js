var FsWriter = require("./lib/fswriter");

module.exports = function(config){
  return new FsWriter(config);
};

var childProcess = require("child_process");
var exec = childProcess.exec;
var Bluebird = require("bluebird");
var fs = Bluebird.promisifyAll(require("fs"));
var path = require("path");

function FsWriter(config){
  this.id = config.id;
  this.dirname = config.dirname || require("os").tmpdir();
  this.client = null;
  this.transforms = config.transforms || {};
}

FsWriter.prototype.addTo = function(app){
  var self = this;
  this.client = app.createClient(this.id);
  this.client.updatePredicate("initialized(Type)", ["FsWriter"], this.id);
  this.client.on("invoke-rule", function(data){

    if(data.predicate === "write(FileName, Mode)" || data.predicate === "write(FileName, Mode, Transform)"){
      self.writeFile(data.groundings, data.payloads, data.rule)
        .catch(function(err){
          console.log(err);
          self.client.updatePredicate("error(ActionId, TimeStamp)", ["WriteFile", Date.now()], err);
        });
    }
  });
}

FsWriter.prototype.writeFile = function(groundings, payload, ruleId){
    var fileName = groundings[0];
    var mode = groundings[1];
    var transformId = groundings[2];
    var ext = path.extname(fileName);
    var payString = typeof(payload) === "string" ? payload: JSON.stringify(payload, null, 2);
    var writeData = (transformId && this.transforms[transformId]) ? this.transforms[transformId](payload) : payString;

    switch(mode){
      case "overwrite" :
        var filePath = path.join(this.dirname, fileName);
        return fs.writeFileAsync(filePath, writeData);
        break;
      case "append" :
        var filePath = path.join(this.dirname, fileName);
        return fs.appendFileAsync(filePath, writeData);
        break;
      case "roll" :
        var rollName = fileName.replace(ext, "_") + Date.now().toString() + ext;
        var filePath = path.join(this.dirname, rollName);
        return fs.writeFileAsync(filePath, writeData);
        break;
      default: return Bluebird.reject(new Error("Mode: " + mode + " is not recognized"));
    }
}

module.exports = FsWriter;

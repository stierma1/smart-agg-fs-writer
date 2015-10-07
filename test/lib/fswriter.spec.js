
var FsWriter = require("../../lib/fswriter");
var EE = require("events").EventEmitter;
var fs = require("fs");
var chai = require("chai");
chai.should();

describe("#FsWriter", function(){
  var upData = null;
  var app = {
    createClient: function(id){
      var ee = new EE();

      ee.updatePredicate = function(pred, groundings, data){
        upData = {pred:pred, groundings:groundings, data:data};
      };

      return ee;
    }
  };

  afterEach(function(){
    upData = null;
  });

  it("should create FsWriter", function(){
    var writer = new FsWriter({id:"test"});
    writer.id.should.equal("test");
  });

  it("should addTo application", function(){
    var writer = new FsWriter({id:"test"});
    writer.addTo(app);
    upData.pred.should.equal("initialized(Type)");
  });

  it("should writefile", function(done){
    var writer = new FsWriter({id:"test", dirname: __dirname});
    writer.addTo(app);
    writer.client.emit("invoke-rule", {predicate:"write(FileName, Mode)", groundings:["test.txt", "overwrite"], payloads:"hello world"});
    setTimeout(function(){
      if(fs.readFileSync(__dirname + "/test.txt", "utf8") === "hello world"){
        done();
        fs.unlinkSync(__dirname + "/test.txt")
        return;
      }
      done(new Error("Set Sail for fail"));
    }, 500)
  });

  it("should transform writefile", function(done){
    var writer = new FsWriter({id:"test", dirname: __dirname, transforms:{"bacon" : function(){return "bacon";}}});
    writer.addTo(app);
    writer.client.emit("invoke-rule", {predicate:"write(FileName, Mode, Transform)", groundings:["test1.txt", "overwrite", "bacon"], payloads:"hello world"});
    setTimeout(function(){
      if(fs.readFileSync(__dirname + "/test1.txt", "utf8") === "bacon"){
        done();
        fs.unlinkSync(__dirname + "/test1.txt")
        return;
      }
      done(new Error("Set Sail for fail"));
    }, 500)
  });
})

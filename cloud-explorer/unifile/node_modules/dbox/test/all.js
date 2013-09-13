var fs      = require("fs")
var should  = require("should")
var dbox    = require("../")
var helpers = require("./config/helpers")

describe("all", function(){
  var root = process.env.ROOT || "sandbox"
  var app_cfg = JSON.parse(fs.readFileSync(__dirname + "/config/" + root + "/app.json"))
  var app     = dbox.app(app_cfg)
  var client, ref;
  
  before(function(done){
    helpers.auth(app, function(access_token){
      client = app.client(access_token)
      done()
    })
  })
  
  it("should get account object", function(done) {
    client.account(function(status, reply){
      status.should.eql(200)
      reply.should.have.property("display_name")
      reply.should.have.property("email")
      done()
    })
  })
  
  it("should create a directory", function(done) {
    client.mkdir("myfirstdir", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myfirstdir")
      done()
    })
  })
   
  it("should remove a directory", function(done) {
    client.rm("myfirstdir", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myfirstdir")
      done()
    })
  })
  
  it("should create a file", function(done) {
    client.put("myfirstfile.txt", "Hello World", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myfirstfile.txt")
      done()
    })
  })
  
  it("should get metadatq of file", function(done) {
    client.metadata("myfirstfile.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myfirstfile.txt")
      done()
    })
  })
  
  it("should get a share for file", function(done) {
    client.shares("myfirstfile.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("url")
      done()
    })
  })
  
  it("should get revisions for file", function(done) {
    client.revisions("myfirstfile.txt", function(status, reply){
      status.should.eql(200)
      reply[0].should.have.property("path", "/myfirstfile.txt")
      done()
    })
  })
  
  it("should get media of file", function(done) {
    client.media("myfirstfile.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("url")
      done()
    })
  })
  
  it("should search for file", function(done) {
    client.search("/", "myfirstfile", function(status, reply){
      status.should.eql(200)
      reply[0].should.have.property("path", "/myfirstfile.txt")
      done()
    })
  })
  
  it("should upload empty file", function(done) {
    client.put("myemptyfile.txt", new Buffer(0), function(status, reply){
      status.should.eql(200)
      done()
    })
  })
  
  it("should move a file", function(done) {
    client.mv("myfirstfile.txt", "myrenamedfile.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myrenamedfile.txt")
      done()
    })
  })
  
  it("should get contents of file", function(done) {
    client.get("myrenamedfile.txt", function(status, reply){
      status.should.eql(200)
      reply.toString().should.eql("Hello World")
      done()
    })
  })
  
  it("should change file", function(done) {
    client.put("myrenamedfile.txt", "Hello Brazil", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myrenamedfile.txt")
      done()
    })
  })
  
  // it("should read directory", function(done) {
  //   client.readdir("/", function(status, reply){
  //     status.should.eql(200)
  //     reply.should.include('/myemptyfile.txt')
  //     reply.should.include('/myrenamedfile.txt')
  //     done()
  //   })
  // })
  
  it("should copy file", function(done) {
    client.cp("myrenamedfile.txt", "myclonefile.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myclonefile.txt")
      done()
    })
  })
  
  it("should get refrence from file from cpref", function(done) {
    client.cpref("myrenamedfile.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property('expires')
      reply.should.have.property('copy_ref')
      ref = reply
      done()
    })
  })
  
  it("should copy file from ref", function(done) {
    client.cp(ref, "myclonefilefromref.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myclonefilefromref.txt")
      done()
    })
  })
  
  it("should get delta results", function(done) {
    client.delta(function(status, reply){
      status.should.eql(200)
      reply.should.have.property("reset", true)
      done()
    })
  })
    
  it("should remove renamed file", function(done) {
    client.rm("myrenamedfile.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myrenamedfile.txt")
      done()
    })
  })
  
  it("should remove cloned file", function(done) {
    client.rm("myclonefile.txt", function(status, reply){
      status.should.eql(200)
      reply.should.have.property("path", "/myclonefile.txt")
      done()
    })
  })
  
  it("should remove cloned file from ref", function(done) {
    client.rm("myclonefilefromref.txt", function(status, reply){
      status.should.eql(200)
      done()
    })
  })
  
  after(function(){
    //console.log("after step")
  })

})


var assert = require('assert')
, expect = require('chai').expect
, helper = require('../helper.js');

if (!helper.checkParams()){
  console.error('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Canceling tests.');
  return;
}

describe('Silex config', function() {

before(function(done) {
    this.timeout(30000);
    helper.startSelenium(function (_) {
        // open silex
        helper.driver.get('http://localhost:6805/silex/index.html').then(function () {
            done();
        });
    });
});
it('should wait to load', function(done) {
    this.timeout(3000);
    // wait for silex to be loaded
    setTimeout(function () {
        done();
    }, 2000)
});

var config;

it('should be valid', function(done) {
    helper.driver.executeScript('return silex.Config.debug;').then(function (res){
        config = res;
        if(config){
            done();
        }
        else{
            done('could not retrieve config from Silex');
        }
    });
});
it('should not be in debug mode', function(done) {
    if (config.debugMode === true){
        done('silex is in debug mode');
    }
    else{
        done();
    }
});

after(function(done) {
   this.timeout(30000);
    // shut down selenium
    helper.stopSelenium(function () {
        done();
    });
});

});

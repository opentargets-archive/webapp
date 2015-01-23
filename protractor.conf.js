exports.config = {
  allScriptsTimeout: 11000,

  specs: [
    'test/e2e/*.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

    getPageTimeout: 10000,
    
    directConnect: true,

    //    seleniumServerJar: './node_modules/protractor/selenium/selenium-server-standalone-2.44.0.jar',
    // seleniumAddress : 'http://localhost:4444/wd/hub',
    
  baseUrl: 'http://localhost:8000/',

    framework: 'mocha',
    mochaOpts : {
	reporter : "spec",
	slow : 3000
    }
};

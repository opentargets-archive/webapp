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

  baseUrl: 'http://localhost:8000/',

    framework: 'mocha',
    mochaOpts : {
	reporter : "spec",
	slow : 3000
    }
};

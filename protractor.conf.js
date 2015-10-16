exports.config = {
    allScriptsTimeout: 11000,

    specs: [

        // 'test/e2e/*.js'
        // 'test/e2e/home.js',
        // 'test/e2e/targetAssociation.js',
        'test/e2e/evidence.js',
        // 'test/e2e/targetProfile.js'
    ],

    // multiCapabilities: [
    //     {'browserName': 'chrome'},
    //     {'browserName': 'firefox'},
    //     // {'browserName': 'safari'}
    // ],

    capabilities: {
        'browserName': 'firefox'
    },

    getPageTimeout: 10000,

    //directConnect: true,

    //    seleniumServerJar: './node_modules/protractor/selenium/selenium-server-standalone-2.44.0.jar',
    seleniumAddress : 'http://localhost:4444/wd/hub',

    baseUrl: 'http://localhost:8000/',

    framework: 'mocha',
    mochaOpts : {
        reporter : "spec",
        slow : 3000
    }
};

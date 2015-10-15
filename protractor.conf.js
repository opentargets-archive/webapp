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
        'browserName': 'chrome',
    },

    getPageTimeout: 10000,

    //directConnect: true,

    //    seleniumServerJar: './node_modules/protractor/selenium/selenium-server-standalone-2.44.0.jar',
    seleniumAddress : 'http://localhost:4444/wd/hub',

    baseUrl: 'http://cttv:dj8mixijk04jpdg@127.0.0.1:8000/',
    //baseUrl: 'https://beta.targetvalidation.org/',

    framework: 'mocha',
    mochaOpts : {
        reporter : "spec",
        slow : 3000
    }
};

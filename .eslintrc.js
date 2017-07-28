module.exports = {
    "parser": "babel-eslint",
    "env": {
        "browser": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:angular/johnpapa"
    ],
    "plugins": [
        "compat"
    ],
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        /**
         * Angular rules
         * Individual rules can be disabled, which we may wish to
         * enable at some point. For example, controllers named
         * eg. *Ctrl.js will throw an error, so the following rule
         * could be switched off (0).
         */
        // "angular/controller-name": 0
        /**
         * Compatibility rules
         */
        "compat/compat": 2
    }
};
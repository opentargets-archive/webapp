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
        "compat",
        "jsdoc"
    ],
    "rules": {
        "indent": [
            "error",
            4
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
         * By default, this uses 
         * Individual rules can be disabled, which we may wish to
         * enable at some point. For example, controllers named
         * eg. *Ctrl.js will throw an error, so the following rule
         * could be switched off (0).
         */
        // "angular/controller-name": 0
        "angular/no-inline-template": [2, {
            "allowSimple": true
        }],
        "angular/di": 2,
        "angular/di-order": 2,
        "angular/interval-service": 2,
        "angular/timeout-service": 2,
        "angular/document-service": 2,
        "angular/no-service-method": 2,
        "angular/log": 2,
        "angular/directive-restrict": [2, {
            "explicit": "always",
            // "restrict": "E"
        }],
        /**
         * Compatibility rules
         */
        "compat/compat": 2,
        /**
         * Documentation rules
         * For further info, see https://github.com/gajus/eslint-plugin-jsdoc
         * (currently set as warnings only)
         */
        "jsdoc/check-param-names": 1,
        "jsdoc/check-tag-names": 1,
        "jsdoc/check-types": 1,
        "jsdoc/newline-after-description": 1,
        "jsdoc/require-description-complete-sentence": 1,
        "jsdoc/require-example": 1,
        "jsdoc/require-hyphen-before-param-description": 1,
        "jsdoc/require-param": 1,
        "jsdoc/require-param-description": 1,
        "jsdoc/require-param-type": 1,
        "jsdoc/require-returns-description": 1,
        "jsdoc/require-returns-type": 1
    }
};
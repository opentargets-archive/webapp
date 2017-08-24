module.exports = {
    "parser": "babel-eslint",
    "env": {
        "browser": true,
        "jquery": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:angular/johnpapa"
    ],
    "plugins": [
        "compat",
        "jsdoc"
    ],
    "globals": {
        "angular": true,
        "d3": true,
        '_': true,
        'moment': true,
        '$': true
    },
    "rules": {
        "curly": 2,
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
        "no-multiple-empty-lines": [2, {
            "max": 2,
            "maxBOF": 1,
            "maxEOF": 1
        }],
        "no-trailing-spaces": 2,
        "semi-spacing": 2,
        "semi-style": 2,
        "space-infix-ops": 2,
        "func-call-spacing": 2,
        "space-in-parens": 2,
        "comma-spacing": 2,
        "keyword-spacing": 2,
        "key-spacing": 2,
        "space-before-function-paren": 2,
        "consistent-return": 2,
        "eqeqeq": 2,
        "space-before-blocks": 2,
        "spaced-comment": 2,
        // "padded-blocks": [2, "never"],
        "comma-dangle": 2,
        // "brace-style": 2,
        // "no-magic-numbers": 2,
        "no-loop-func": 2,
        "dot-location": [2, "property"],
        "dot-notation": 2,
        "object-curly-spacing": 2,
        "computed-property-spacing": 2,
        "eol-last": 2,
        /**
         * Angular rules
         * By default, this uses 
         * Individual rules can be disabled, which we may wish to
         * enable at some point. For example, controllers named
         * eg. *Ctrl.js will throw an error, so the following rule
         * could be switched off (0).
         */
        "angular/no-inline-template": [2, {
            "allowSimple": true
        }],
        "angular/di": [2, "array"],
        "angular/interval-service": 2,
        "angular/timeout-service": 2,
        "angular/document-service": 2,
        "angular/no-service-method": 2,
        "angular/log": 2,
        "angular/directive-restrict": [2, {
            "explicit": "always",
        }],
        "angular/component-limit": 2,
        "angular/di-unused": 2,
        "angular/function-type": [2, "anonymous"],
        "angular/no-service-method": 2,
        "angular/watchers-execution": [2, "$apply"],
        "angular/angularelement": 1,
        "angular/controller-name": [2, "/[A-Z].*Ctrl/"],
        "angular/directive-name": [2, "ot"],
        "angular/factory-name": [2, "ot"],
        "angular/filter-name": [2, "ot"],
        "angular/module-name": [2, "ot"],
        // "angular/file-name": [2, {
        //     "typeSeparator": "dash",
        //     "nameStyle": "dash",
        //     "ignorePrefix": "ot",
        //     "componentTypeMappings": {
        //         "controller": "controller"
        //     }
        // }],
        "angular/file-name": 0,
        "angular/controller-as": 0,
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

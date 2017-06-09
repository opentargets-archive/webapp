
angular.module('cttvFilters', [])
    .filter('split', function () {
        'use strict';

        return function(input, splitChar, splitIndex) {
            // do some bounds checking here to ensure it has that index
            return input.split(splitChar)[splitIndex];
        };
    })

    .filter('clearUnderscores', function () {
        'use strict';

        return function (input) {
            return input.replace(/_/g,' ');
        };
    })
    .filter('upperCaseFirst', function () {
        'use strict';

        return function (input) {
            return input.charAt(0).toUpperCase() + input.slice(1);
        };
    })

    .filter('stripTags', function() {
        'use strict';

        return function(text) {
            return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    })

    .filter('ellipseText', function() {
        'use strict';

        return function(text, length) {
            return  text.length>length ? text.substring(0,length)+"&hellip;" : text;
        };
    })

    .filter('monthToString', function() {
        'use strict';

        return function(mi) {
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return  months[mi] || "";
        };
    })

    .filter('spaceToUnder', function(){
        'use strict';

        return function (str){
            return str.replaceAll(" ","_");
        }
    })

    /**
     * Shorten number to thousands, millions, billions, etc.
     * http://en.wikipedia.org/wiki/Metric_prefix
     *
     * @param {number} num Number to shorten.
     * @param {number} [digits=0] The number of digits to appear after the decimal point.
     * @returns {string|number}
     *
     * @example
     * // returns '12.5k'
     * shortenLargeNumber(12543, 1)
     *
     * @example
     * // returns '-13k'
     * shortenLargeNumber(-12567)
     *
     * @example
     * // returns '51M'
     * shortenLargeNumber(51000000)
     *
     * @example
     * // returns 651
     * shortenLargeNumber(651)
     *
     * @example
     * // returns 0.12345
     * shortenLargeNumber(0.12345)
     */
    .filter('metricPrefix', function () {
        'use strict';

        return function (num, digits) {
            var units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
                decimal;

            for(var i=units.length-1; i>=0; i--) {
                decimal = Math.pow(1000, i+1);

                if(num <= -decimal || num >= decimal) {
                    return +(num / decimal).toFixed(digits) + units[i];
                }
            }

            return num;
        };
    });

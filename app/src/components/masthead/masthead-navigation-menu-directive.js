angular.module('otDirectives')
    /*
     * Navigation menu with hamburger option
     */
    .directive('otMastheadNavigationMenu', ['otConfig', function (otConfig) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                isHamburger: '=?'     // show as hamburger [true | false]
            },

            template: ''
                        + '<ul class="masthead-navigation">'

                        + '    <!-- regular inline menu -->'
                        + '    <li ng-repeat="item in nav" ng-if="!isHamburger && item.label">'
                        + '        <div ng-if="item.menu==undefined">'
                        + '            <a href="{{item.href}}">{{item.label}}</a>'
                        + '        </div>'
                        + '        <div uib-dropdown on-toggle="toggled(open)" ng-if="item.menu!=undefined">'
                        + '             <a href uib-dropdown-toggle>{{item.label}} <span class="fa fa-angle-down"></span></a>'
                        + '             <ul class="uib-dropdown-menu" uib-dropdown-menu>'
                        + '                 <li ng-repeat="subitem in item.menu"><a ng-if="subitem.target" target={{subitem.target}} href="{{subitem.href}}">{{subitem.label}}</a><a ng-if="!subitem.target" href="{{subitem.href}}">{{subitem.label}}</a></li>'
                        + '             </ul>'
                        + '        </div>'
                        + '    </li>'

                        + '    <!-- hamburger menu -->'
                        + '    <li ng-if="isHamburger">'
                        + '        <div uib-dropdown on-toggle="toggled(open)">'
                        + '             <a href uib-dropdown-toggle><span class="fa fa-bars fa-lg"></span></a>'
                        + '             <ul class="uib-dropdown-menu ot-dropdown-hamburger" uib-dropdown-menu>'
                        + '                 <li ng-repeat="item in navhmb" ng-if="item.label">'
                        + '                     <a href="{{item.href}}">{{item.label}}</a>'
                        + '                 </li>'
                        + '             </ul>'
                        + '        </div>'
                        + '    </li>'

                        + '</ul>',


            link: function (scope) {
                scope.dumps_link = otConfig.dumps_link;
                scope.nav = otConfig.mastheadNavigationMenu;
                scope.navhmb = [];

                // if the menu is a hamburger, we flatten the tree to display all in one list
                if (scope.isHamburger) {
                    otConfig.mastheadNavigationMenu.forEach(function (i) {
                        if (i.menu) {
                            i.menu.forEach(function (j) {
                                scope.navhmb.push({label: i.label + ': ' + j.label, href: j.href});
                            });
                        } else {
                            scope.navhmb.push(i);
                        }
                    });
                }

                // this can be triggered when toggling a dropdown
                /* scope.toggled = function(open) {
                    //$log.log('Dropdown is now: ', open);
                };*/

                // this must be defined here I suppose? some bootstrap thingy that's called automatically...
                // UPDATE: actually, it seems to work even without, so commenting out for now
                /* scope.toggleDropdown = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    //scope.status.isopen = !scope.status.isopen;
                };*/
            }
        };
    }]);

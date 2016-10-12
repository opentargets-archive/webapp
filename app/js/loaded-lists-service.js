/* Services */

angular.module('cttvServices')

    .factory('cttvLoadedLists', ['$log', 'localStorageService', function($log, localStorageService) {
        var lists = {};
        // lists.all = [];
        var key = "targetLists";

        // Gets all the lists from local storage
        function getFromLS () {
            var targetListsStoredStr = localStorageService.get(key);
            var targetListsStored = [];
            if (targetListsStoredStr) {
                targetListsStored = JSON.parse(targetListsStoredStr);
            }
            return targetListsStored;
        }

        // Stores all the lists to local storage
        function storeInLS (lists) {
            localStorageService.set(key, JSON.stringify(lists));
        }

        lists.getAll = function () {
            var targetListsStoredStr = localStorageService.get(key);
            lists.all = getFromLS();
            return lists.all;
        };

        lists.add = function (id, list) {
            // Is there a list with the same id already? if yes, overwrite it, if not push the new list
            var index;
            for (var i=0; i<lists.all.length; i++) {
                var l = lists.all[i];
                if (l.id === id) {
                    index = i;
                    break;
                }
            }
            if (index !== undefined) {
                lists.all.splice(index, 1, {
                    id: id,
                    list: list
                });
            } else {
                lists.all.push({
                    id: id,
                    list: list
                });
            }
            storeInLS(lists.all);
        };

        lists.getLast = function () {
            lists.all = getFromLS();
            return lists.all[lists.all.length-1];
        };

        lists.get = function (id) {
            lists.all = getFromLS();
            var l;
            for (var i=0; i<lists.all.length; i++) {
                var item = lists.all[i];
                if (item.id === id) {
                    return item;
                }
            }
        };

        lists.clear = function () {
            localStorageService.remove(key);
        };

        lists.remove = function (id) {
            lists.all = getFromLS();
            var index;
            for (var i=0; i<lists.all.length; i++) {
                var list = lists.all[i];
                if (list.id === id) {
                    index = i;
                    break;
                }
            }
            if (index !== undefined) {
                lists.all.splice(index, 1);
            }
            storeInLS(lists.all);
            return lists.all;
        };

        return lists;
    }]);

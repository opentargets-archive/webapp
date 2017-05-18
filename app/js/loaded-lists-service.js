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
            // var targetListsStoredStr = localStorageService.get(key);
            lists.all = getFromLS();
            return lists.all;
        };

        // Updates a list. This list needs to be the first
        lists.save = function () {
            storeInLS(lists.all);
        };

        // id is the id for the list (normally the file name
        // list is the actual list
        // keys has all the target ids for the list
        lists.add = function (id, list, duplications, keys) {
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
                    keys: keys,
                    duplications: duplications,
                    list: list
                });
            } else {
                lists.all.push({
                    id: id,
                    keys: keys,
                    duplications: duplications,
                    list: list
                });
            }
            storeInLS(lists.all);
        };

        // lists.getLast = function () {
        //     lists.all = getFromLS();
        //     return lists.all[lists.all.length-1];
        // };

        // Gets the list by id,
        // but also moves this list in the last position (if it is not there)
        lists.get = function (id) {
            lists.all = getFromLS();
            for (var i=0; i<lists.all.length; i++) {
                var item = lists.all[i];
                if (item.id === id) {
                    // If this is not the last list, move to last
                    if (i !== lists.all.length-1) {
                        lists.all.splice(i, 1);
                        lists.all.push(item);
                        storeInLS(lists.all);
                    }
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

        lists.parseBestHitSearch = function (name, resp) {
            var listSearch = [];
            var parsed;
            var keys = {};
            var duplications = 0;
            for (var i = 0; i < resp.data.length; i++) {
                var search = resp.data[i];
                parsed = undefined;
                // Avoid target duplication
                // TODO: I'm not sure how the getBestHitSearch rest api endpoint handles duplicated entries. Just in case, we avoid duplications here as well
                if (keys[search.id]) {
                    duplications++;
                    continue;
                }
                if (search.id && search.data) {
                    keys[search.id] = true;
                    parsed = {
                        approved_symbol: search.data.approved_symbol,
                        id: search.id,
                        isExact: search.exact,
                        query: search.q
                    };
                }
                listSearch.push({
                    query: search.q,
                    selected: (parsed !== undefined),
                    result: parsed
                })
            }
            lists.add(name, listSearch, duplications, keys);
            return name;
        };

        return lists;
    }]);

angular.module('otDirectives')


    /**
     * Load and display blog posts.
     * @params limit : the max number of posts to fetch; defaults to "all"
     */
    .directive('otBlogFeed', ['$log', '$http', function ($log, $http) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                limit: '@'
            },
            templateUrl: 'src/components/feeds/blog-feed.html',
            link: function (scope) {
                scope.limit = scope.limit || 'all';
                var url = ghost.url.api('posts', {
                    limit: scope.limit,
                    // include: 'posts, author, tags',
                    // fields: 'title, html, meta_description, published_at, slug, author, tags',
                    include: 'posts, author',
                    fields: 'title, html, meta_description, published_at, slug, author',
                    order: 'published_at DESC'
                });
                var proxy_url = '/proxy/' + url.substr(2);  // e.g. '/proxy/blog.opentargets.org/ghost/api/v0.1/tags/?limit=all&include=count.posts&order=count.posts%20DESC&client_id=ghost-frontend&client_secret=a9fe83f50655'
                var href_url = ghost.url.api().split('ghost')[0];

                $http.get(url)
                    .then(function successCallback (response) {
                        scope.posts = response.data.posts || [];
                        scope.posts.forEach(function (i) {
                            i.pubDate = new Date(i.published_at);   // make published_at string into Date object for easier formating
                            i.desc = i.meta_description || i.html;  // authors don't always put a description, so let's use the full html as a backup plan
                            i.link = href_url + i.slug;               // the url to the full post on the blog
                        });
                    }, function errorCallback (response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        $log.warn('Error fetching blog posts. ', response);
                    });
            }
        };
    }]);

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

                // $log.log('!! '+proxy_url);

                $http.get(proxy_url)
                    .then(function successCallback (response) {
                        $log.info('blog: ', response);
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


// TODO: cttvBlogFeed appears to be unused (and superceded by otBlogFeed) - can we remove?

// .directive('cttvBlogFeed', ['$log', '$http', function ($log, $http) {
//     'use strict';

//     return {
//         restrict: 'EA',
//         scope: {},
//         template :   '<div class="hp-blog-feed">'
//                     //+'    <p>{{feed.title}}</p><p>{{feed.description}}</p>'
//                     +'    <div class="hp-blog-feed-post" ng-repeat="post in feed.item">'
//                     +'        <h5 class="hp-blog-feed-post-header"><a href="{{post.link}}">'
//                     +'            {{post.title}}'
//                     +'        </a></h5>'
//                     +'        <div class="clearfix text-lowlight">'
//                     +'            <p class="pull-left">By {{post.creator.toString()}}</p>'           // author
//                     //+'            <p class="pull-right">{{post.pubDate.toLocaleDateString("en-GB")}}</p>' // date
//                     +'            <p class="pull-right">{{post.pubDate.getDate()}} {{post.pubDate.getMonth() | otMonthToString}} {{post.pubDate.getFullYear()}}</p>' // date
//                     +'        </div>'
//                     +'        <div ng-bind-html="post.description | otStripTags | otEllipseText:130"></div>'                            // long description
//                     +'        <div class="text-lowlight text-small" ng-if="post.category"><span class="fa fa-tags"></span> {{post.category.join(", ")}}</div>'   // tags
//                     +'    </div>'
//                     +'</div>',
//         link: function(scope, element, attrs) {
//             $http.get('/proxy/blog.opentargets.org/rss/')
//             //$http.get('rss.xml')    // JUST FOR TESTING and DEVELOPING LOCALLY WITHOUT THE PROXY
//                 .then(function successCallback(response) {

//                     var x2js = new X2JS();
//                     var feed = x2js.xml_str2json(response.data);

//                     // The feed should be already ordered by date, but it seems sometimes it isn't,
//                     // so for now we sort it; maybe in the future we won't need to... will ask Eliseo about blog pub dates
//                     // 1. parse the pub dates to unix timestamp
//                     feed.rss.channel.item.forEach(function(i){
//                         i.pubDate = new Date(i.pubDate);
//                     });
//                     // 2. sort item array by timestamp
//                     feed.rss.channel.item.sort(function (a, b) {
//                         return b.pubDate.getTime() - a.pubDate.getTime();
//                     });


//                     scope.feed = feed.rss.channel;

//                 }, function errorCallback(response) {
//                     // called asynchronously if an error occurs
//                     // or server returns response with an error status.
//                 });

//         }
//     };
// }])

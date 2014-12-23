angular.module('d3', []).

factory('d3Service', [function(){
    
    /*
    
    IMPORTANT NOTE:
    so this is one of the recommended methods for integrating Angular with D3 that I found on the web:
    http://www.ng-newsletter.com/posts/d3-on-angular.html

    They suggest 2 options and I don't really like any of them:
    1. copy and paste D3 source code below here and return that
    2. load D3 into a dynamically created <script> tag

    Option 1 is kinda ugly I reckon, but it makes sense in terms of Angular modules / dependencies
    Option 2 is better, but then each time you use the created service, you have to use then() as the service returns a promise (since we have to load the script)


    WHAT I HAVE AT THE MOMENT
    Well, the code here doesn't actually do anything!
    D3 is imported directly in index.html and the d3 object is available in the global namespace, so we can just call it directly from our directives etc.
    The advantage of implementing it as an Angular service would for Angular dependencies, but TBH in this context it shouldn't be an issue since:
     - we control and use the code as we like
     - D3 will be used pretty much in all pages, so it makes sense to import it from the beginning...
	

	TODO
	I've deprecated this module and in d3controllers.js / circlePackGraph I have removed the requirement for d3Service.
	
	See how you feel about this: we can keep it like this or revert it back toa service.


	*/
    
    //var d3;
    // insert d3 code here

    return window.d3;
}]);
# CTTV Web App

This is the web app for the CTTV project, based on the CoreDB API.
The app is based on Angular, while D3 is used for visualization and graphs.


## Getting started
Clone the repository and install the dependencies.


### Prerequisites
You'll obvoiously need git to clone the repository.

Installation and tests need some node.js tools:
you must have `node.js` and its package manager `npm` installed.  You can get them from [http://nodejs.org/](http://nodejs.org/)

Installing bower globally also helps
```
npm install -g bower
```

### Install
Tools are installed via NPM. To run the installer run
```
npm install
```

This installs the required node modules and calls `bower install` which takes care of all Angular dependencies.
So `npm install` creates two directories:
* `node_modules` - npm packages for the needed tools (bower, http-server and modules for testing)
* `app/bower_components` - all Angular code. Note that the `bower_components` folder would normally be installed in the root folder but we change this location through the `.bowerrc` for neater deployment.

Angular code is installed via Bower includes:
* UI Bootstrap (Angular directives)
* Bootstrap (css)
* FontAwesome (css)
* D3

## Running and deploying the app
To test your app, you can just run the included simple `http-server` by running:
```
npm start
```
Then go to
```
http://localhost:8000/app/
```

All the code you need for deployment is contained in
```
/app
```

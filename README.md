# CTTV Web App

This is the web app for the CTTV project, based on the CoreDB API.
The app is based on Angular, while D3 is used for visualization and graphs.


## Getting started 
Clone the repository and install the dependencies.


### Prerequisites
You'll obvoiously need git to clone the repository.

Installation and tests need some node.js tools:
you must have `node.js` and its package manager `npm` installed.  You can get them from [http://nodejs.org/](http://nodejs.org/)


### Install
Tools are installed via NPM.
Angular code is installed via Bower.
Angular code also need:
* UI Bootstrap (Angular directives)
* Bootstrap (css)
* FontAwesome (css)
* D3

To run the installer run
```
npm install
```

This creates two directories:

## Deploying and running the app
All the code you need to deploy for the web app is contained in
```
/app
```

The `bower_components` folder would normally be installed in the root folder but we change this location through the `.bowerrc` for neater deployment.

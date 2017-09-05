


/* Services */

angular.module('cttvServices')
/**
* services to access AWS S3 buckets and their objects
*/
    .factory('awsS3service', ['$http', '$log', '$location', '$rootScope', '$q', '$timeout', 'cttvConfig', function($http, $log, $location, $rootScope, $q, $timeout, cttvConfig) {
        'use strict';
        var awsS3 = {

        };

        awsS3.downloadobj = function(){

            
             AWS.config.update(
              {
                accessKeyId: cttvConfig.AWS_ACCESS_KEY_ID,
                secretAccessKey: cttvConfig.AWS_SECRET_KEY,
                region: 'us-east-1'
              });


            var s3 = new AWS.S3();
            var s3Params = {
                Bucket: 'aal-opentargets-data/23andme/summary/',
                Key: 'PD-AAO_GBA-carriers_2016.html',
                ContentType: 'text/html',
                ServerSideEncryption: 'AES256',
            };
            s3.getObject(s3Params, function(err, data) {
            if (err === null) {
               res.attachment('summary.html');
               res.send(data.Body);
                  } else {
                  console.log("Error downloading data from S3 bucket : ",err);
               res.status(500).send(err);
                  }

                  });
                };

        return awsS3;
    }]);

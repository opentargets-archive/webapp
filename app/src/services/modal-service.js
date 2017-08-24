/* Services */

angular.module('cttvServices')
    .factory('cttvModal', [function () {
        var modalService = {};

        /* modalService.modalInstance; // the single modal instance?
    modalService.sayHello  = function(){$log.log("hello world")};
    modalService.test = function(){
        $log.log("modal test!");
        $uibModal.open({
            template: '<cttv-modal header="I am a test modal" on-ok="$uibModalInstance.sayHello()" hasok="true">'
                            +'<p>And this is the content</p>'
                        +'</cttv-modal>',
            size: "sm",
            // controller: ['$uibModalInstance',
            //                 function($uibModalInstance){
            //                     $log.log($uibModalInstance);
            //                     return $uibModalInstance.dismiss(bob);
            //             }]
        });
    }*/

        // open; instance is stored as modalInstance so can always be retrieved (assuming)
        /* modalService.open = function(o){
        if(modalService.modalInstance){
            modalService.modalInstance.close();
        }
        modalService.modalInstance = $uibModal.open(o);
        return modalService.modalInstance;
    }*/


        return modalService;
    }]);

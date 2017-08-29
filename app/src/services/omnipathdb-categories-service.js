angular.module('cttvServices')
.factory('otOmnipathdbCategories', [function () {
  return {
      'Pathways': {
          'SignaLink3': true,
          'Signor': true,
          'Reactome': true,
          'SPIKE': true
      },
      'Enzyme-substrate': {
          'PhosphoPoint': true,
          'HPRD': true,
          'HPRD-phos': true,
          'MIMP': true,
          'HuPho': true
      },
      'PPI': {
          'BioGRID': true,
          'InnateDB': true,
          'IntAct': true,
          'DIP': true,
          'STRING': true
      }
  };
}]);

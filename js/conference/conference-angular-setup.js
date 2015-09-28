var conferenceModule = angular.module('conferenceModule', ['ui.router', "firebase", 'ui.bootstrap', 'wu.masonry']);

conferenceModule.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home' , {
            url: '/home',
            templateUrl: 'partials/home.html'
        });
        
    $urlRouterProvider.when('', '/home');
}]);

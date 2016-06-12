var conferenceModule = angular.module('conferenceModule', ['ui.router', "firebase", 'ui.bootstrap', 'wu.masonry']);

conferenceModule.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home' , {
            url: '/home',
            templateUrl: 'partials/home.html',
            controller: "PhotozzapHomeController"
        })
        .state('view', {
            url: '/v/:conferenceKey',
            templateUrl: 'partials/view.html',
            controller: "PhotozzapCtrl"
        });
        
    $urlRouterProvider.when('', '/home');
}]);

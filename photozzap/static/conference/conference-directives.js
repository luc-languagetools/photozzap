
conferenceModule.directive('thumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: ThumbnailsCtrl,
      templateUrl: 'thumbnails.html',
      link: function (scope, elem, attrs) {
        console.log("thumbnails directive link");
        console.log("elem: ", elem);
        scope.init("sorted_images", elem);
      }
  };
});
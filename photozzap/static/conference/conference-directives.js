
conferenceModule.directive('photothumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: ThumbnailsCtrl,
      templateUrl: 'photos-thumbnails.html',
      link: function (scope, elem, attrs) {
        console.log("thumbnails directive link");
        console.log("elem: ", elem);
        scope.init("sorted_images", elem);
      }
  };
});


conferenceModule.directive('usersthumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: ThumbnailsCtrl,
      templateUrl: 'users-thumbnails.html',
      link: function (scope, elem, attrs) {
        scope.init("sorted_users", elem);
      }
  };
});

conferenceModule.directive('upload', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: UploadCtrl,
      templateUrl: 'upload.html',
      link: function (scope, elem, attrs) {
      }
  };
});
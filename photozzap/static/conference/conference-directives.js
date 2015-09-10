
conferenceModule.directive('photoswipethumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: PhotoswipeThumbnailsCtrl,
      scope: true,
      templateUrl: 'photoswipe_thumbnails.html',
      link: function (scope, elem, attrs) {
        console.log("thumbnails directive link");
        console.log("elem: ", elem);
        scope.init("sorted_images", elem, true);
      }
  };
});


conferenceModule.directive('photothumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: ThumbnailsCtrl,
      scope: true,
      templateUrl: 'photos-thumbnails.html',
      link: function (scope, elem, attrs) {
        console.log("thumbnails directive link");
        console.log("elem: ", elem);
        scope.init("sorted_images", elem, true);
      }
  };
});


conferenceModule.directive('usersthumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: ThumbnailsCtrl,
      scope: true,
      templateUrl: 'users-thumbnails.html',
      link: function (scope, elem, attrs) {
        scope.init("sorted_users", elem, false);
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


conferenceModule.directive('follow', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: FollowCtrl,
      scope: true,
      templateUrl: 'follow-controls.html',
  };
});


conferenceModule.directive('holderFix', function () {
    return {
        link: function (scope, element, attrs) {
            Holder.run({ images: element[0], nocss: true });
        }
    };
});
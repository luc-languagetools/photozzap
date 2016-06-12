
conferenceModule.directive('photoswipethumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: "PhotoswipeThumbnailsCtrl",
      scope: true,
      templateUrl: 'partials/photoswipe_thumbnails.html',
      link: function (scope, elem, attrs) {
        console.log("thumbnails directive link");
        console.log("elem: ", elem);
        scope.init("sorted_images", elem, true);
      }
  };
});

conferenceModule.directive('photoswipeui', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: "PhotoswipeUICtrl",
      scope: true,
      templateUrl: 'partials/photoswipe_ui.html',
      link: function (scope, elem, attrs) {
        scope.init();
      }
  };
});


conferenceModule.directive('photothumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: "ThumbnailsCtrl",
      scope: true,
      templateUrl: 'partials/photos-thumbnails.html',
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
      controller: "ThumbnailsCtrl",
      scope: true,
      templateUrl: 'partials/users-thumbnails.html',
      link: function (scope, elem, attrs) {
        scope.init("sorted_users", elem, false);
      }
  };
});

conferenceModule.directive('upload', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: "UploadCtrl",
      templateUrl: 'partials/upload.html',
      link: function (scope, elem, attrs) {
      }
  };
});

conferenceModule.directive('holderFix', function () {
    return {
        link: function (scope, element, attrs) {
            Holder.run({ images: element[0], nocss: true });
        }
    };
});
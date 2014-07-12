
conferenceModule.directive('thumbnails', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      controller: ThumbnailsCtrl,
      template: '<div class="col-md-12">\
                    <ul rn-carousel rn-carousel-buffered rn-carousel-control rn-carousel-indicator rn-carousel-index="thumbnail_group_index" class="ng-cloak"\
                    ng-if="sorted_images.length > 0">\
                        <li ng-repeat="group in thumbnail_groups track by group.id_list">\
                            <div class="thumbnail-container-tight" ng-style="{width: thumbnails_width + \'%\'}" ng-repeat="image in group.objs track by image.id">\
                                <a class="thumbnail-tight" ng-click="show_image(image.id)">\
                                  <img ng-src="{{cloudinary_thumbnail_url(image.id)}}">\
                                </a>\
                            </div>\
                        </li>\
                    </ul>\
                    <div class="tab_outer_empty_container" ng-if="sorted_images.length == 0">\
                        <div class="empty_container">\
                            <div class="row empty_container_inner">\
                                <div class="col-xs-12 col-sm-12 col-md-6 col-lg-6">\
                                    <h2>No Photos</h2>\
                                </div>\
                                <div class="col-xs-12 col-sm-12 col-md-6 col-lg-6">\
                                    <h3>Upload Photos using <span class="icon-upload"></span> Upload tab below.</h3>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                </div>',
      link: function (scope, elem, attrs) {
        console.log("thumbnails directive link");
        scope.init("sorted_images");
      }
  };
});
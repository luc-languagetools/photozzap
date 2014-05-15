function ThumbnailsCtrl($scope, $log) {
    $scope.thumbnail_groups = [];
    $scope.num_thumbnails = 3;
    $scope.thumbnails_width = 33;
    $scope.thumbnail_group_index = 0;

    $scope.init = function(watch_expression)
    {    
        $scope.watch_expression = watch_expression;
        $scope.$watch($scope.watch_expression, $scope.watch_handler, true); 
    }
    
    $scope.refresh_thumbnail_groups = function() {
        $log.info("change in ", $scope.watch_expression , " generating thumbnail groups");
        $scope.thumbnail_groups = $scope.generate_thumbnail_groups();
        $log.info("thumbnail_groups: ", $scope.thumbnail_groups);
        if ($scope.thumbnail_group_index >= $scope.thumbnail_groups.length &&
            $scope.thumbnail_group_index > 0) {
            // the index is too far ahead, there aren't enough groups
            $log.info("changing thumbnail_group_index as there aren't enough groups");
            $scope.thumbnail_group_index = $scope.thumbnail_groups.length - 1;
        }
    };
    
    $scope.refresh_num_thumbnails = function() {
        var window_width = $scope.window_dimensions.width;
    
        if (window_width > 1500) {
            $scope.num_thumbnails = 10;
        } else if (window_width > 1300) {
            $scope.num_thumbnails = 9;
        } else if (window_width > 1100) {
            $scope.num_thumbnails = 8;            
        } else if (window_width > 1024) {
            $scope.num_thumbnails = 7;            
        } else if (window_width > 770) {
            $scope.num_thumbnails = 6;
        } else if (window_width > 500) {
            $scope.num_thumbnails = 5;
        } else if (window_width > 400) {
            // iphone4 landscape
            $scope.num_thumbnails = 4;
        } else if (window_width >= 320) {
            // iphone4 portrait
            $scope.num_thumbnails = 3;
        } else {
            $scope.num_thumbnails = 2;
        }
        var temp_width = (100 / $scope.num_thumbnails) * 10.0;
        var int_width = Math.floor(temp_width);
        $scope.thumbnails_width = int_width / 10.0;
        $log.info("refresh_num_thumbnails: num_thumbnails: " + $scope.num_thumbnails +
                  " thumbnails_width: " + $scope.thumbnails_width);
    };
    $scope.refresh_num_thumbnails();

    $scope.watch_handler = function(newValue, OldValue) {
        $scope.refresh_thumbnail_groups();
    };
    
    $scope.$watch("window_dimensions.width", function(newValue, oldValue) {
        $scope.refresh_num_thumbnails();
    });
    
    $scope.$watch("num_thumbnails", function(newValue, oldValue) {
        // number of shown thumbnails has changed, we must regenerate thumbnail groups
        $scope.refresh_thumbnail_groups();
    });
    
    // return thumbnail groups which can be used with angular-carousel
    $scope.generate_thumbnail_groups = function() {
        var result = [];
        var obj_array = $scope[$scope.watch_expression];
        if (obj_array == undefined) {
            return [];
        }
        var current_group = [];
        for (var i = 0; i < obj_array.length; i++) {
            current_group.push(obj_array[i]);
            if ((i + 1) % $scope.num_thumbnails == 0) {
                var id_list = $.map(current_group, function(obj, i){ return obj.id; });
                result.push({id_list: id_list.join("_"),
                             objs: current_group});
                current_group = [];
            }
        }
        if (current_group.length > 0 ) {
            var id_list = $.map(current_group, function(obj, i){ return obj.id; });
            result.push({id_list: id_list.join("_"),
                         objs: current_group});
        }
        
        $log.info("num groups: " + result.length);
        
        return result;
    };
}


function ThumbnailsCtrl($scope, $log, $element) {
    $scope.thumbnail_groups = [];
    $scope.num_rows = 1;
    $scope.num_cols = 3;
    $scope.thumbnails_width = 33;
    $scope.thumbnail_group_index = 0;

    $scope.init = function(watch_expression, elem, highlight_current)
    {    
        $log.info("init ThumbnailsCtrl with " + watch_expression);
        $scope.watch_expression = watch_expression;
        $scope.$watch($scope.watch_expression, $scope.watch_handler, true); 
        
        $scope.elem = elem;
        
        $log.info("elem width: ", elem.width());
        if (elem.width() == 0) {
            // wait before refreshing num thumbnails
            $timeout($scope.refresh_num_thumbnails, 3000);
        } else {
            // refresh right away
            $scope.refresh_num_thumbnails();
        }
        
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
    
        var available_width = $scope.elem.width();
        $scope.num_cols = Math.max(3, Math.floor(available_width / 110))
        var actual_thumbnail_size = available_width / $scope.num_cols;

        var temp_width = (100 / $scope.num_cols) * 10.0;
        var int_width = Math.floor(temp_width);
        $scope.thumbnails_width = int_width / 10.0;
        
        $log.info("refresh_num_thumbnails: ",
                  " num_cols ", $scope.num_cols,
                  " num_rows ", $scope.num_rows,
                  " thumbnails_width: ", $scope.thumbnails_width);
    };

    $scope.watch_handler = function(newValue, OldValue) {
        $scope.refresh_thumbnail_groups();
        // also refresh num thumbnails, in case there was an initialization issue
        $scope.refresh_num_thumbnails();
    };
    
    $scope.$watch("window_dimensions.width", function(newValue, oldValue) {
        $scope.refresh_num_thumbnails();
    });
    
   
    $scope.$watch("num_cols", function(newValue, oldValue) {
        // number of shown thumbnails has changed, we must regenerate thumbnail groups
        $scope.refresh_thumbnail_groups();
    });    

    $scope.$watch("num_rows", function(newValue, oldValue) {
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
            if ((i + 1) % ($scope.num_cols * $scope.num_rows) == 0) {
                var id_list = $.map(current_group, function(obj, i){ return obj.id; });
                result.push({id_list: id_list.join("_"),
                             objs: current_group});
                current_group = [];
            }
        }
        if (current_group.length > 0 ) {
            if (current_group.length < $scope.num_cols ) {
                // pad current group with empty thumbnails
                var num_padding = $scope.num_cols - current_group.length;
                for (var i = 0; i < num_padding; i++) {
                    var padding_obj = {padding: true,
                               id: "padding_" + i};
                    current_group.push(padding_obj);
                }
            }
        
            var id_list = $.map(current_group, function(obj, i){ return obj.id; });
            result.push({id_list: id_list.join("_"),
                         objs: current_group});
        }
        
        $log.info("num groups: " + result.length);
        
        return result;
    };
}

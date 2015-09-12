conferenceModule.controller("ChatCtrl", ["$scope", "$log", "$filter", function($scope, $log, $filter) {
    $scope.display_num_pages = 1;
    $scope.comment_pages = [];
    $scope.comment_data = {};

    $scope.submit_comment = function() {
        $log.info("submit_comment: " + $scope.comment_data.text);
        $scope.comments.$add({user_id: $scope.login_obj.user.uid,
                              nickname: $scope.conference_user_object.nickname,
                              image_id: $scope.conference_user_object.viewing_image_id,
                              time_added: Firebase.ServerValue.TIMESTAMP,
                              text: $scope.comment_data.text}); 
        $scope.comment_data.text = "";
    }
    
    $scope.show_more = function() {
        $scope.display_num_pages++;
    }
    
    $scope.show_latest_only = function() {
        $scope.display_num_pages = 1;
    }
   
    $scope.refresh_num_comment_groups = function() {
        var window_width = $scope.window_dimensions.width;
    
        if (window_width >= 1400) {
            $scope.num_comment_groups = 12;
        } else if (window_width >= 992) {
            $scope.num_comment_groups = 9;
        } else if (window_width >= 768) {
            $scope.num_comment_groups = 6;
        } else {
            $scope.num_comment_groups = 3;
        }    
    }
    
    $scope.refresh_num_comment_groups();
    
    $scope.refresh_groups = function() {
        if ($scope.conference == undefined) {
            // cannot do anything yet
            return;
        }
        var sorted_comments =  $filter('orderObjectByAndInsertId')($scope.conference.comments, 'time_added');
        
        var process_group = function(current_group, comment_groups) {
            var id_list = $.map(current_group.comments, function(obj, i){ return obj.id; });
            var id_list_str =  id_list.join("_");
            current_group.id_list = id_list_str;
            // take timestamp from last comment
            current_group.timestamp = current_group.comments[current_group.comments.length - 1].time_added;
            comment_groups.push(current_group);        
        };
        
        // sort in groups
        var comment_groups = [];
        var current_image_id = undefined;
        var current_group = undefined;
        var cumulative_comment_length = 0;
        var cumulative_comment_num = 0;
        var current_nickname = undefined;
        for(var i in sorted_comments) {
            var comment = sorted_comments[i];        
            if (current_image_id != comment.image_id || cumulative_comment_length > 250 || cumulative_comment_num > 7 ) {
                // process old group
                if (current_group != undefined) {
                    process_group(current_group, comment_groups);
                    current_nickname = undefined;
                }
                // create new group
                current_group = {image_id: comment.image_id,
                                 comments: []};   
                current_image_id = comment.image_id;
                cumulative_comment_length = 0;
                cumulative_comment_num = 0;
            }
            if (comment.nickname != current_nickname) {
                comment.display_nickname = true;
            } else {
                comment.display_nickname = false;
            }
            current_group.comments.push(comment);
            cumulative_comment_length += comment.text.length;
            cumulative_comment_num += 1;
            current_nickname = comment.nickname;
        }
        if (current_group != undefined && current_group.comments.length > 0 ) {
            process_group(current_group, comment_groups);
        }
        
        // group comments in "pages"
        
        var comment_pages = [];
        var current_page_groups = [];
        var cycle_counter = 0;
        for (var i = comment_groups.length - 1; i >= 0; i--) {
            var comment_group = comment_groups[i];
            current_page_groups.push(comment_group);
            var cycle = (cycle_counter + 1) % $scope.num_comment_groups;
            if ((cycle_counter + 1) % $scope.num_comment_groups == 0) {
                current_page_groups.reverse();
                var id_list = $.map(current_page_groups, function(obj, j){ return obj.id_list; });
                var timestamp = current_page_groups[current_page_groups.length - 1].timestamp;
                comment_pages.push({id_list: id_list.join("_"),
                             objs: current_page_groups,
                             timestamp: timestamp});
                current_page_groups = [];
            }
            cycle_counter++;
        }
        if (current_page_groups.length > 0 ) {
            current_page_groups.reverse();
            var id_list = $.map(current_page_groups, function(obj, j){ return obj.id_list; });
            // take timestamp from last group
            var timestamp = current_page_groups[current_page_groups.length - 1].timestamp;
            comment_pages.push({id_list: id_list.join("_"),
                                objs: current_page_groups,
                                timestamp: timestamp});        
        }
        
        comment_pages.reverse();
        
        $scope.comment_pages = comment_pages;
    }
    
   
    $scope.$watch("num_comment_groups", function(newValue, oldValue) {
        $scope.refresh_groups();
    }, true);
    
    $scope.$watch("conference.comments", function(newValue, OldValue) {
        $log.info("watch conference.comments");
        $scope.refresh_groups();
    }, true);    
    
    
    $scope.$watch("window_dimensions.width", function(newValue, oldValue) {
        $scope.refresh_num_comment_groups();
    });    
    
}]);
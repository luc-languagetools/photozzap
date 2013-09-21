
// pnotify-specific
var stack_bottomright = {"dir1": "up", "dir2": "left", "firstpos1": 25, "firstpos2": 25};

var use_pnotify_notifications = false;

var element_id_increment = 0;

var ConferenceUi = {

    // last combined notification that was displayed. this is stored to determine whether an upcoming
    // notification should be combined with that one.
    // the object should have the following format:
    //   notification.image: the image concerned
    //   notification.user_added: undefined, or user who uploaded
    //   notification.users_viewing: array of users viewing (can be empty)
    //   notification.comments: array of comments:
    //     comment.user: author
    //     comment.text: comment text
    //   notification.modified: false if the notification hasn't changed, true if it needs to be refreshed
    //   pnotice: pnotify handle

    current_combined_notification: undefined,
    
    combined_notifications_summary: function() {
        result = "";
        for( var image_id in ConferenceUi.combined_notifications ) {
            result += image_id + ", ";
        }
        return result;
    },
    
    combined_notification_to_string: function( combined_notification ) {
        var result = "";
        result += "combined_notification:\n";
        result += " image_id: " + combined_notification.image.id + "\n";
        if (combined_notification.user_added != null) {
            result += " user_added: " + combined_notification.user_added.nick + "\n";
        }
        result += " users_viewing: [";
        for( var user_index in combined_notification.users_viewing ) {
            var user = combined_notification.users_viewing[user_index];
            result += user.nick + ", ";
        }
        result += "]\n";
        result += " comments: [";
        for( var comment_index in combined_notification.comments ) {
            var comment = combined_notification.comment[ comment_index ];
            result += comment.user.nick + ": " + comment.text + ", ";
        }
        result += "]\n";
        result += " modified: " + combined_notification.modified + "\n";
        result += " element_id: " + combined_notification.element_id + "\n";
        
        return result;
    },
    
    add_notification: function( notification ) {
    
        // notification.image is the image object
        // notification.type can be:
        //  - viewing
        //  - added
        //  - comment
        // notification.user is the subject
        // notification.text is text comment, or undefined
    
    
        // 1. determine whether new notification should be combined with an older one or not
        var merged = ConferenceUi.merge_notification( notification );
        
        // 2. remove existing open notifications if a merge is happening
        if( merged ) {
            ConferenceUi.close_combined_notification( ConferenceUi.current_combined_notification );
        }

        // 3. display new notification
        ConferenceUi.display_combined_notification( ConferenceUi.current_combined_notification );
        
    },
    
    merge_notification: function( notification ) {
    
        var merged = false;
    
        if ( ConferenceUi.current_combined_notification != undefined &&
             ConferenceUi.current_combined_notification.image.id == notification.image.id &&
             notification.timestamp.getTime() < ConferenceUi.current_combined_notification.timestamp.getTime() + 1000*30) { // less than 30s old
             
             // re-use previous notification
             
             merged = true;
        } else {
        
            // create new notification
        
            ConferenceUi.current_combined_notification = {image: notification.image,
                                                          user_added: undefined,
                                                          users_viewing: new Array(),
                                                          comments: new Array(),
                                                          element_id: undefined,
                                                          timestamp: notification.timestamp};
        
        }
    
        if( notification.type == "added" ) {
            ConferenceUi.current_combined_notification.user_added = notification.user;
        } else if ( notification.type == "comment" ) {
            ConferenceUi.current_combined_notification.comments.push({user: notification.user,
                                                                      nick: notification.nick,
                                                                      text: notification.text});
        } else if ( notification.type == "viewing" ) {
            // add the user in the new image
            ConferenceUi.current_combined_notification.users_viewing.push(notification.user);
        }
        
        return merged;
    },
    
    close_combined_notification: function( combined_notification ) {
        // remove notification

        // close sidebar notification
        if( combined_notification.element_id != undefined ) {
            var sideBarNotificationSelector = "#" + combined_notification.element_id;
            log("deleting selector: " + sideBarNotificationSelector);
            $(sideBarNotificationSelector).fadeOut('fast', function() {
                // remove element
                $(sideBarNotificationSelector).remove();
            });
        }

    },
    
    
    display_combined_notification: function( combined_notification ) {
        // re-display the notification
        log("refreshing combined notification: for: " + combined_notification.image.id);
        
        // obtain element id's
        combined_notification.element_id = image_notification_dom_id( combined_notification.image ) + "_" + element_id_increment;
        element_id_increment += 1;

        // create notification element for the sidebar
        sidebar_notification_element = $("#combined-notification-template2").jqote(combined_notification);
        $("#history-sidebar-content").prepend(sidebar_notification_element);
        
        // add timeago
        jQuery("#" + combined_notification.element_id + " .timestamp").timeago();
        
        // expand history sidebar
        displayHistorySidebarForNotification("#" + combined_notification.element_id);
                
        // add click event handler
        add_click_event_to_history_image("#" + combined_notification.element_id + " a", combined_notification.image);
        
  
        combined_notification.modified = false;
    },
    
    
    notify_new_image: function(image) {
    
        var notification = {image: image,
                            type: "added",
                            user: image.added_by,
                            timestamp: image.timestamp};
        ConferenceUi.add_notification(notification);
    
    },
    
    notify_viewing_image: function(user) {
        var notification = {image: user.viewing,
                            type: "viewing",
                            user: user,
                            timestamp: user.timestamp};
        ConferenceUi.add_notification(notification);
    },
    
    notify_comment: function(comment) {
        comment['type'] = 'comment';
        ConferenceUi.add_notification(comment);
    }
    
};

function remove_user_element_if_present(user) {
    $("#" + dom_id_from_user(user)).remove();
};

$(document).bind('user_joined', function (ev, user) {
    log("user joined: jid: " + user.jid + " nick: " + user.nick);
    
    // do we already have an entry for this guy ? if so, remove it
    remove_user_element_if_present(user);

    // create wrapper element
    user_wrapper = $('#user-wrapper-template').jqote({element_id: dom_id_from_user(user)});
    
    // create inner element from template
    user_element = $('#user-inner-template').jqote(user);
    user_wrapper = $(user_wrapper).append(user_element);

    log("adding the following element: ");
    log(user_wrapper);
    
    $('#users-sidebar-content').append(user_wrapper);
    // slide down
    var selector = "#" + dom_id_from_user(user);
    log("sliding down: [" + selector + "]");
    $(selector).slideDown();
});

$(document).bind('user_left', function (ev, user) {
    log("user left: jid: " + user.jid + " nick: " + user.nick);
    remove_user_element_if_present(user);
});

function add_click_event_to_history_image(selector, image) {
    $(selector).click(function() {
        // thumbnail clicked
        log("image thumbnail clicked");
        $(document).trigger('not_following_user');
        $(document).trigger('show_current_image', false);
        $(document).trigger('display_image', image);
        $(document).trigger('hide_toolbar');
    });
}

function add_click_event_to_new_image(selector, image) {
    log("add_click_event_to_new_image, selector: [" + selector + "]");
    $(selector).click(function() {
        // thumbnail clicked
        log("image thumbnail clicked");
        $(document).trigger('not_following_user');
        $(document).trigger('show_current_image', false);
        $(document).trigger('display_image', image);
        $(document).trigger('hide_toolbar');
    });
};

function add_click_event_to_user_viewing(selector, user) {
    $(selector).click(function() {
        // thumbnail clicked
        log("image thumbnail clicked");
        $(document).trigger('show_current_image', false);
        $(document).trigger('display_image', user.viewing);
        $(document).trigger('following_user', user);
    });
};

$(document).bind('new_image', function(ev, image) {
    // create element from template
    image_element = $("#image-template").jqote(image);
    $('#image-list').prepend(image_element);
    add_click_event_to_new_image("#image-list #"+image.thumbnail_id + " a", image);
    
    ConferenceUi.notify_new_image(image);
    
    // add comment holder
    var comment_list_obj = {element_id: image_comment_list_dom_id(image)};
    var comment_list_element = $("#comment-list-template").jqote(comment_list_obj);
    $("#comment_list_area").append(comment_list_element);
    
    if (Conference.currently_viewing == null) {
        // not currently viewing an image, show this one
        $(document).trigger('display_image', image);
    }
    
});

$(document).bind('display_image', function(ev, image) {
    log("conference-ui display_image");
    
    // hide all comments
    $("#comment_list_area .comment-holder").hide();
    // show the relevant comment area
    $("#comment_list_area #" + image_comment_list_dom_id(image)).show();
        
    image_element = document.createElement('img');
    $(image_element).attr('src', image.url);
    $(image_element).attr('id', 'displayed-image');
    $("#main_image").html(image_element);
	$(document).trigger('resize_image');
});

$(document).bind('user_update', function(ev, user) {

    // create inner element from template
    user_element = $('#user-inner-template').jqote(user);

    // replace it in the DOM
    $("#" + dom_id_from_user(user)).html(user_element);
    add_click_event_to_user_viewing("#" + dom_id_from_user(user) + " a", user);
    
    // don't notify if this is ourself.
    if (Conference.nickname != user.nick ) {
        // don't notify if the user is not viewing an image
        if (user.viewing != null ) {
           ConferenceUi.notify_viewing_image(user);
        }
    }

});

$(document).bind('connection_status', function(ev, status) {
    $("#connection-status-text").html(status);
});

$(document).bind('connection_complete', function(ev, status) {
    $('#connection-status-modal').modal('hide');
    $('#current_nick').html("<b>" + Conference.nickname + "</b>");
});

$(document).bind('connection_error', function(ev, status) {
    $("#connection-status-text").html(status);
    $('#connection-status-modal').modal('show');
    $("#progress-bar-connection").show();
    $("#choose-nickname-form").hide();
});

$(document).bind('enter_nickname', function(ev, status) {
    // $("#connection-status-text").html(status);
    $("#choose-nickname-form").show();
    $("#connection-status-text").html(status);
    $("#progress-bar-connection").hide();
    
    $("#chosen-nickname").focus();
    
    $("#join-conference").click(function() {
        click_join();
    });
    
    $("#chosen-nickname").keyup(function (e) {
        log("chosen-nickname keyup");
        var key = e.keyCode || e.which;
        if (key == 13) {
            click_join();
        }
        
    });    
});

function click_join() {
    var nickname = $("#chosen-nickname").val();
    if (nickname.match(/[^a-zA-Z0-9]/g)) {
        $(document).trigger('enter_nickname', "Only lowercase, uppercase characters and numbers are allowed. No spaces.");
    } else {        
        Conference.join_chatroom(nickname);
    };
};


$(document).bind('upload_in_progress', function(ev, status) {
    log("upload_in_progress");
    $("#progress-bar").fadeIn('slow');
    $("#progress-bar-label").html(status);
});


$(document).bind('upload_done', function(ev, image) {
    log("upload_done");
    $('#progress-bar').fadeOut('slow');
    $("#progress-bar-label").html("");
});

function dom_id_from_user(user) {
    if ( Conference.jid_to_id_mapping[ user.jid ] == undefined ) {
        // create a mapping
        var result = user.jid.replace(/[^a-zA-Z0-9]/g, "_");
        result = result + "_" + randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        Conference.jid_to_id_mapping[ user.jid ] = result;
    }

    result = Conference.jid_to_id_mapping[ user.jid ];
    return result;
};

function dom_id_from_user_popover(user) {
    return dom_id_from_user(user) + "_popover";
};

function user_viewing_popover_selector(user) {
    return selector = '#notification-popover-list #' + dom_id_from_user_popover(user);
};

function image_notification_dom_id(image) {
    return "image_notification_" + image.id;
};

function image_comment_list_dom_id(image) {
    return "comment_list_" + image.id;
};

$(document).bind('following_user', function(ev, user) {
    // indicate we are following user on the task bar
    $("#following_nick").html("following " + user.nick);
});

$(document).bind('not_following_user', function(ev) {
    // indicate we are NOT following user on the task bar
    $("#following_nick").html("");
});


$(document).bind('new_comment', function(ev, comment) {
    log("received new comment: " + comment.text);
    
    var comment_element = $("#comment-template").jqote(comment);
    $(comment_element).prependTo($("#" + image_comment_list_dom_id(comment.image))).hide().slideDown();
    
    // add timeago
    $("#" + image_comment_list_dom_id(comment.image) + " .unapplied-timestamp").timeago();
    $("#" + image_comment_list_dom_id(comment.image) + " .unapplied-timestamp").removeClass("unapplied-timestamp");
    
    
    $("#"+comment.image.thumbnail_id + " .comments-available").css('visibility', '');
    
    ConferenceUi.notify_comment(comment);

});

$(document).bind('resize_image', function(ev) {
	// ensure image is fullscreen
    // this should work with any aspect ratio
	
    var image = $("#main_image img").first();
    var imageWidth = image.width();
    var imageHeight = image.height();
    var imageRatio = imageWidth / imageHeight;
	
	var win = $(window);
	var winWidth = win.width();
    var winHeight = win.height();
    var winRatio = winWidth / winHeight;
  
	var newImageWidth = 0;
	var newImageHeight = 0;
  
    if(winRatio > imageRatio) {
        newImageWidth = "auto";
		newImageHeight = winHeight;	
	} else {
		newImageWidth = winWidth;
        newImageHeight = "auto";
    }	
	log("newImageWidth: " + newImageWidth + " newImageHeight: " + newImageHeight);
	image.css({
		width: newImageWidth,
        height: newImageHeight,
        marginTop: "0px"
    })
	
    var topSpacing = 0;	
    if (winRatio < imageRatio) {
        var imageHeight = image.height();
        topSpacing = (winHeight - imageHeight) / 2;
       	image.css({
            marginTop: topSpacing + "px"
        })
    }
    
});

var clone = (function(){ 
  return function (obj) { Clone.prototype=obj; return new Clone() };
  function Clone(){}
}());
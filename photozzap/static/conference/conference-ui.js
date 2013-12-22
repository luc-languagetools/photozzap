
// pnotify-specific
var stack_bottomright = {"dir1": "up", "dir2": "left", "firstpos1": 25, "firstpos2": 25};

var use_pnotify_notifications = false;

var element_id_increment = 0;

var ConferenceUi = {

	swipe_transition_in_progress: false,
	swipe_already_translated: 0,

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
    
    notification_area_clear_timeout: null,
    
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
                                                          timestamp: notification.timestamp,
                                                          delayed: notification.delayed};
        
        }
    
        if( notification.type == "added" ) {
            ConferenceUi.current_combined_notification.user_added = notification.user;
        } else if ( notification.type == "comment" ) {
            ConferenceUi.current_combined_notification.comments.push({user: notification.user,
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
    
	// determine whether we must flash a notification, in some cases
	// we don't want that.
	must_flash_notification: function( combined_notification ) {
		var must_flash = true;
		
		// delayed notification ?
		if( combined_notification.delayed == true ) {
			must_flash = false;
		}
		
		// is this a comment only, and 
		//  - is user viewing the image
		//  - does user have chat window expanded
		if ( combined_notification.user_added == undefined &&
		     combined_notification.users_viewing.length == 0  &&
			 combined_notification.comments.length >= 1 &&
			 combined_notification.image.id == Conference.currently_viewing &&
			 $("#chat-sidebar").data("expanded") == true ) {
			 
			must_flash = false;			 
		}
		
		return must_flash;
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
        add_click_event_to_history_image("#" + combined_notification.element_id, combined_notification.image);        
        
        
        if( ConferenceUi.must_flash_notification(combined_notification) ) {
            // clone element and place it in notification-area
            var combined_notification_clone = clone(combined_notification);
            combined_notification_clone.element_id = "notification_area_" + element_id_increment;
            var notification_area_element = $("#combined-notification-template2").jqote(combined_notification_clone);
            notification_area_element = $(notification_area_element).addClass("notification-preview");
            // cancel clear timeout if needed
            if (ConferenceUi.notification_area_clear_timeout != null) {
                clearTimeout(ConferenceUi.notification_area_clear_timeout);
                ConferenceUi.notification_area_clear_timeout = null;
            }
            // remove previous elements
            insertNewElement = function() {
                // now add new elements
                $("#notification-area").prepend(notification_area_element);
                // add timeago
                jQuery("#" + combined_notification_clone.element_id + " .timestamp").timeago();
                var notification_area_element_selector = "#" + combined_notification_clone.element_id;
                add_click_event_to_history_image("#" + combined_notification_clone.element_id, combined_notification_clone.image);
                // setup positionning
                //$(notification_area_element_selector).css({
                $(notification_area_element_selector).fadeIn();
                ConferenceUi.notification_area_clear_timeout = setTimeout(function() {
                    $("#notification-area .image-preview").fadeOut('fast', function() {
                        // permanently remove elements
                        $("#notification-area .image-preview").remove();
                    }); 
                }, 1700);
            }
            if ($("#notification-area .image-preview").length > 0 ) {
                $("#notification-area .image-preview").fadeOut('fast', function() {
                    // permanently remove elements
                    $("#notification-area .image-preview").remove();
                    insertNewElement();
                });
            } else {
                insertNewElement();
            }
        }
 
        combined_notification.modified = false;
    },
    
    
    notify_new_image: function(image) {
    
        var notification = {image: image,
                            type: "added",
                            user: image.added_by_nick,
                            timestamp: image.timestamp,
                            delayed: image.delayed};
        ConferenceUi.add_notification(notification);
    
    },
    
    notify_viewing_image: function(user) {
        var notification = {image: user.viewing,
                            type: "viewing",
                            user: user.nick,
                            timestamp: user.timestamp,
                            delayed: false};
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
        log("image thumbnail clicked for id: " + image.id);
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
    /*
    // create element from template
    image_element = $("#image-template").jqote(image);
    $('#image-list').prepend(image_element);
    add_click_event_to_new_image("#image-list #"+image.thumbnail_id, image);
    */
    
    
    // add comment holder
    var comment_list_obj = {element_id: image_comment_list_dom_id(image)};
    var comment_list_element = $("#comment-list-template").jqote(comment_list_obj);
    $("#comment_list_area").append(comment_list_element);
    
    ConferenceUi.notify_new_image(image);
    
    if (Conference.currently_viewing == null) {
        // not currently viewing an image, show this one
        $(document).trigger('display_image', image);
    }
});

function show_comments_for_image(image) {
    // hide all comments
    $("#comment_list_area .comment-holder").hide();
    // show the relevant comment area
    $("#comment_list_area #" + image_comment_list_dom_id(image)).show();
}

function rebuild_swipe_container() {
	if( ConferenceUi.swipe_transition_in_progress ) {
		// swipe transition in progress, don't modify the swipe container
		return;
	}

	log("maintaining swipe images container");
	$("#swipe_images img").remove();
	$("#swipe_images").css("transform", "translateX(0px)");	
	var totalRatio = 0;
	// figure out the total ratio to resize the container first
	for( var i in Conference.image_data.swipe_images_list ) {
		var image = Conference.image_data.swipe_images_list[i];
		totalRatio += image.ratio;
	}
	var winHeight = getWinHeight();
	var newWidth = winHeight * totalRatio;
	// add 10% buffer
	newWidth = Math.round(newWidth * 1.10);
	// set swipe_images's width to total width
	$("#swipe_images").css("width", newWidth + "px");		
	for( var i in Conference.image_data.swipe_images_list ) {
		var image = Conference.image_data.swipe_images_list[i];
		var img = $(document.createElement('img'));
		img.attr('src', image.base_image_url());
		img.appendTo('#swipe_images');
		var n_child = parseInt(i) + 1;
		var selector = "#swipe_images img:nth-child(" + n_child + ")";
		log("rebuild_swipe_container: " + selector);
		resize_image(image, selector);
	}
	
	var translateX = getDefaultTranslateX();
	performTranslateX(translateX);
	
	ConferenceUi.swipe_already_translated = 0;
}

function getDefaultTranslateX() {
	// figure out what the translation needs to be
	var translateX = 0;
	var img1Width = $("#swipe_images img:nth-child(1)").width();
	var img2Width = $("#swipe_images img:nth-child(2)").width();
	// if prev_image is present, translate X is img1Width + img2Width/2 - winWidth/2
	// if prev_image is not present, translate X is img1Width/2 - winWidth/2
	if( Conference.image_data.prev_image != undefined ) {
		translateX = -( img1Width + img2Width / 2 - getWinWidth() / 2 );
	} else {
		translateX = -( img1Width / 2 - getWinWidth() / 2 );
	}
	return translateX;
}

function performTranslateX(translateX) {
	var cssTransform = "translateX(" + translateX + "px)";
	$("#swipe_images").css("transform", cssTransform);
}

function performTranslateXTransition(translateX, done) {
	$('#swipe_images').transition({ x: translateX + 'px'}, 500, done);
}

$(document).bind('display_image', function(ev, image) {
    log("conference-ui display_image");
    show_comments_for_image(image);
});

$(document).bind('display_image_internal', function(ev, image) {
    show_comments_for_image(image);
});


$(document).bind('user_update', function(ev, user) {

    // create inner element from template
    user_element = $('#user-inner-template').jqote(user);

    // replace it in the DOM
    $("#" + dom_id_from_user(user)).html(user_element);
    add_click_event_to_user_viewing("#" + dom_id_from_user(user), user);
    
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
    $("#loading-screen").hide();
    $('#current_nick').html("<b>" + Conference.nickname + "</b>");
});

$(document).bind('connection_error', function(ev, status) {
    $("#connection-status-text").html(status);
    $("#loading-screen").show();
});

$(document).bind('nickname_change_successful', function(ev, new_nick) {
    log("nickname_change_successful");
    $("#user-nickname").html(new_nick);
    $("#nickname-change-container div").remove();
});

$(document).bind('nickname_change_request', function(ev, status) {
    $("#nickname-change-container div").remove();

    var request_options = {status: status};
    var changeNicknamePanel = $("#nickname-panel-template").jqote(request_options);
    
    $("#nickname-change-container").append(changeNicknamePanel);
    
    $("#chosen-nickname2").focus();

    // disable default action of form submission
    $('form').submit(function() {
      return false;
    }); 

    $("#join-conference2").click(function() {
        change_nickname("#chosen-nickname2");
    });
    
    $("#chosen-nickname2").keyup(function (e) {
        log("chosen-nickname keyup");
        var key = e.keyCode || e.which;
        if (key == 13) {
            change_nickname("#chosen-nickname2");
        }
        
    });
})

function change_nickname(selector) {
    var nickname = $(selector).val();
    if (nickname.match(/[^a-zA-Z0-9]/g)) {
        $(document).trigger('nickname_change_request', "Only lowercase, uppercase characters and numbers are allowed. No spaces.");
    } else {        
        Conference.change_nickname(nickname);
    };
};


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
    $(comment_element).prependTo($("#" + image_comment_list_dom_id(comment.image))).hide();
    
    // add timeago
    $("#" + image_comment_list_dom_id(comment.image) + " .unapplied-timestamp").timeago();
    $("#" + image_comment_list_dom_id(comment.image) + " .unapplied-timestamp").removeClass("unapplied-timestamp");
    
    // now slide down
    $("#" + image_comment_list_dom_id(comment.image) + " .new-comment").slideDown();
    
    $("#"+comment.image.thumbnail_id + " .comments-available").css('visibility', '');
    
    ConferenceUi.notify_comment(comment);

});

function ensure_optimal_image_resolution(image, winRatio, imageRatio) {
    var pixelRatio = 1;
    if( window.devicePixelRatio != undefined ) {
        pixelRatio = window.devicePixelRatio;
    }
    
    var win = $(window);
    var winWidthPx = Math.floor(win.width() * pixelRatio);
    var winHeightPx = Math.floor(win.height() * pixelRatio);
    
    // get the maximum dimension, align it to 100 pixels (so we don't end up calculating every possible res on cloudinary)
    if (winRatio < imageRatio) {
        // width is the scaled dimension
        var maxDimension = Math.ceil(winWidthPx / 100) * 100;
    } else {
        // height is the scaled dimension
        var maxDimension = Math.ceil(winHeightPx / 100) * 100;
    }
    
    // only download if this dimension is higher than what we have downloaded right now
    if (maxDimension > image.loaded_dimension) {
        Conference.download_higher_resolution(image, maxDimension);
    }
}

function download_highres_thumbnails() {
    result = false;
    if ($(window).width() > 640 ||
        $(window).height() > 640) {
        result = true;
    }
    return result;
}

function getWinHeight() {
    var win = $(window);
    var winHeight = win.height();
	return winHeight;
}

function getWinWidth() {
    var win = $(window);
    var winWidth = win.width();
	return winWidth;
}

function getWinRatio() {
    var win = $(window);
    var winWidth = win.width();
    var winHeight = win.height();
    var winRatio = winWidth / winHeight;
	
	return winRatio;
}

function resize_image(image, selector) {
    var imageRatio = image.ratio;

    var win = $(window);
    var winWidth = win.width();
    var winHeight = win.height();
    var winRatio = getWinRatio();
  
    log("winWidth: " + winWidth + " winHeight: " + winHeight + " winRatio: " + winRatio);
  
	var newImageWidth = 0;
	var newImageHeight = 0;
  
    if(winRatio > imageRatio) {
        newImageWidth = "auto";
        newImageHeight = "100%";
    } else {
        newImageWidth = "100%";
        newImageHeight = "auto";
    }
    
   
    var topSpacing = 0;	
    if (winRatio < imageRatio) {
        var imageHeight = winWidth / imageRatio;
        topSpacing = (winHeight - imageHeight) / 2;
        log("topSpacing: " + topSpacing);
        
        $(selector).css({
            width: newImageWidth,
            height: newImageHeight,
            marginTop: topSpacing + "px"
        })        
    } else {
        $(selector).css({
            width: newImageWidth,
            height: newImageHeight,
            marginTop: "0px"
        }) 
    }
}

function resize_image_area() {
    // ensure image is fullscreen
    // this should work with any aspect ratio
    
    if (Conference.currently_viewing == undefined ) {
        return;
    }
    
	var selector = "#displayed_image img";
    var image = Conference.images[Conference.currently_viewing];
	resize_image(image, selector);	

    var win = $(window);
    var winWidth = win.width();
    var winHeight = win.height();	
	
    // resize blur image to take up all available space, don't respect aspect ratio
    $("#blur_image img").css({width: winWidth,
                              height: winHeight});    
    
    $("#control_event_layer").css({width: winWidth,
                                   height: winHeight});
                                   
    ensure_optimal_image_resolution(image, getWinRatio(), image.ratio);
	
	rebuild_swipe_container();
}

function transition_next() {
	if( ConferenceUi.swipe_transition_in_progress == true) {
		// don't perform two animations at once
		return;
	}
	ConferenceUi.swipe_transition_in_progress = true;
	// if prev_image is present, translateX is img1Width + img2Width + img3Width / 2 - winWidth /2
	// if prev_image is not present, translateX is img1Width + img2Width / 2 - winWidth / 2
	var translateX = 0;
	
	var img1Width = $("#swipe_images img:nth-child(1)").width();
	var img2Width = $("#swipe_images img:nth-child(2)").width();
	var img3Width = $("#swipe_images img:nth-child(3)").width();
	
	if (Conference.image_data.prev_image != undefined ) {
		translateX = -( img2Width / 2 + img3Width / 2 );
	} else {
		//translateX = -( img1Width + img2Width / 2 - getWinWidth() / 2 );
		translateX = -( img1Width / 2 + img2Width / 2 );
	}
	
	transition_swipe(translateX);
}

function transition_prev() {
	if( ConferenceUi.swipe_transition_in_progress == true) {
		// don't perform two animations at once
		return;
	}

	ConferenceUi.swipe_transition_in_progress = true;
	
	var img1Width = $("#swipe_images img:nth-child(1)").width();
	var img2Width = $("#swipe_images img:nth-child(2)").width();
	
	var translateX = img1Width / 2 + img2Width / 2 ;

	transition_swipe(translateX);
}

function transition_swipe(translateX) {
	if (ConferenceUi.swipe_already_translated != 0) {
		translateX -= ConferenceUi.swipe_already_translated;
		ConferenceUi.swipe_already_translated = 0;
	}

	$("#swipe_images").css("opacity", 1.0);
	$('#swipe_images').
		transition({ x: translateX + 'px'}, 500, function(){
			$('#swipe_images').transition({ opacity: 0.0}, 1000, function() {
				ConferenceUi.swipe_transition_in_progress = false;
				rebuild_swipe_container();
			});
		});
}

function cancel_swipe_transition() {
	var translateX =  - ConferenceUi.swipe_already_translated;
	ConferenceUi.swipe_already_translated = 0;
	log("cancel_swipe_transition starting");
	performTranslateXTransition(translateX, function() {
		log("cancel_swipe_transition done");
		$("#swipe_images").css("opacity", 0.0);		
		$("#displayed_image").css("opacity", 1.0);
	});
}

$(document).bind('resize_image', function(ev) {
    resize_image_area();
});

function show_upload_modal() {
    $.get('/upload_data', function(upload_data) {
        log("received upload data: " + upload_data);
        $("input.cloudinary-fileupload[type=file]").fileupload({formData: upload_data,
                                                                url: 'https://api.cloudinary.com/v1_1/photozzap/image/upload'});
        $('#upload-modal').modal('show');
    });
}

function hide_upload_modal() {
    $('#upload-modal').modal('hide');
}

function show_progress_bar() {
    $("#progress-bar .bar").css("width", "0%");
    $("#progress-bar-label").html("Uploading image(s)"); 
    $("#progress-container").fadeIn();
}

function hide_progress_bar() {
    $("#progress-container").fadeOut();
    $("#progress-bar-label").html("");
}

function update_progress_bar(e, data) { 
    $("#progress-bar .bar").css('width', Math.round((data.loaded * 100.0) / data.total) + '%'); 
}

String.prototype.trunc = String.prototype.trunc ||
      function(n){
          return this.length>n ? this.substr(0,n-1)+'&hellip;' : this;
      };

var clone = (function(){ 
  return function (obj) { Clone.prototype=obj; return new Clone() };
  function Clone(){}
}());
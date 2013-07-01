

var ConferenceUi = {

	notification_popover_open: false,
    user_viewing_timeouts: {},
    
    // indexed by image id
    image_removal_timeouts: {},
    
    // indexed by image id
    open_notifications: {},
    
    
    open_notifications_to_string: function() {
        result = "";
    
        for (var image_id in ConferenceUi.open_notifications) {
            result = result + " { image_id: " + image_id + ": ";
            var notification_list = ConferenceUi.open_notifications[image_id];
            for( var i in notification_list ) {
                notification = notification_list[i];
                log("notification type: " + notification.type);
                if (notification.type == "viewing") {
                    result = result + " viewing: " + notification.user.nick + " ";
                }
            }
            result = result + "}";
        }
        return( result );
    },
    
    users_viewing: function( image_id ) {
        var user_list = new Array();
        var notification_list = ConferenceUi.open_notifications[image_id];
        for( var i in notification_list ) {
            notification = notification_list[i];
            log("notification type: " + notification.type);
            if (notification.type == "viewing") {
                // result = result + " viewing: " + notification.user.nick + " ";
                user_list.push(notification.user.nick);
            }
        }
        return user_list.join(", ");
    },
    
	open_new_popover_if_needed: function() {
        if (! ConferenceUi.notification_popover_open ) {
            // open the popover first
            notification_popover_element = $("#notification-popover").jqote();

            $("#all_images_button").popover({title: "<b>Notifications</b>", 
                                             content: notification_popover_element,
                                             placement: "bottom",
                                             trigger: "manual",
                                             html: "true"});
            $("#all_images_button").popover('show');
            
            ConferenceUi.notification_popover_open = true;
        }
	
	},
	
    adjust_popover_size: function() {
        num_children = $('#notification-popover-list').children().length;
        target_width = num_children * 240;
        size_px = target_width.toString() + "px";
        log("setting size to " + size_px);
        $('.popover').css({'max-width': '1000px',
                               'width':size_px});        
    },
    
    remove_notification_and_close_popover_if_needed: function(selector) {
		// locate the element and remove it
        if ( selector != undefined ) {
            $(selector).remove();
        }
		
		// how many are left ?
		if ($('#notification-popover-list').children().length == 0 ) {
			// close the popover
            
			ConferenceUi.notification_popover_open = false;
			$("#all_images_button").popover('destroy');                
		} else {
            ConferenceUi.adjust_popover_size();
        }
    },
	
    notify_new_image: function(image) {
        log("notify_new_image: " + image.id);
		ConferenceUi.open_new_popover_if_needed();
    
        // now add the actual images
        image_element = $("#new-image-template").jqote(image);
        
        // add the element to the popover element
        $('#notification-popover-list').prepend(image_element);
        
        ConferenceUi.adjust_popover_size();

        selector = '#notification-popover-list #' + image.thumbnail_id;
        a_selector = selector + " a";
        
        // add click event
        add_click_event_to_new_image(a_selector, image);
        
        // add removal timer
        setTimeout(function() {
            selector = '#notification-popover-list #' + image.thumbnail_id;
			ConferenceUi.remove_notification_and_close_popover_if_needed(selector);
        }, 2500);        
        
    },
    
    
    update_image_notification: function(image) {
    
        ConferenceUi.open_new_popover_if_needed();
    
        // remove the existing element
        var template_id = viewing_image_notification_dom_id(image);
        image_notification_selector = "#notification-popover-list #" + template_id;
        $(image_notification_selector).remove();
        
        // cancel and remove an existing timeout if any were active
        if( ConferenceUi.image_removal_timeouts[ image.id ] != undefined ) {
            clearTimeout(ConferenceUi.image_removal_timeouts[ image.id ]);
            delete ConferenceUi.image_removal_timeouts[ image.id ];
        }

        // check the number of open notifications
        if ( ConferenceUi.open_notifications[image.id] != undefined &&
             ConferenceUi.open_notifications[image.id].length > 0 ) {

            // create new element
            var use_plural = false;
            if (ConferenceUi.open_notifications[image.id].length > 1) {
                use_plural = true;
            }
            var notification_data = {id: template_id,
                                     user_list: ConferenceUi.users_viewing(image.id),
                                     use_plural: use_plural,
                                     thumbnail: image.thumbnail};
            
            image_element = $("#combined-notification-template").jqote(notification_data);
            
            // add the element to the popover element
            $('#notification-popover-list').prepend(image_element);
            
            var a_selector = image_notification_selector + " a";
            add_click_event_to_new_image(a_selector, image);
            
            // update click event
            
            ConferenceUi.adjust_popover_size();
            
            // add timeout for removal
            ConferenceUi.image_removal_timeouts[ image.id ] = setTimeout(function() {
                log("remove image_notification for  " + image.id);
            
                // remove timeout variable
                delete ConferenceUi.image_removal_timeouts[ image.id ];
                var template_id = viewing_image_notification_dom_id(image);
                image_notification_selector = "#notification-popover-list #" + template_id;            
                ConferenceUi.remove_notification_and_close_popover_if_needed(image_notification_selector);
                
                delete ConferenceUi.open_notifications[ image.id ];
                   
            }, 2500);

        } else {
            ConferenceUi.remove_notification_and_close_popover_if_needed(undefined);
        }
        
    },
    
    notify_viewing_image: function(user) {
        // insert pop-over under "Users"
        log("notify_viewing_image for " + user.nick + " image id: " + user.viewing.id);
        
        // is the user viewing any other images ?
        var update_image = undefined;
        for (var image_id in ConferenceUi.open_notifications) {
            var notification_list = ConferenceUi.open_notifications[image_id];
            var new_notification_list = new Array();
            for( var j in notification_list ) {
                var notification = notification_list[j];
                if (notification.type == "viewing" && 
                    notification.user.jid == user.jid) {
                    // indicate that this user is not viewing this image anymore
                    // this will get updated later
                    update_image = notification.image;
                } else {
                    // copy array element
                    new_notification_list.push(notification);
                }
            }
            if (new_notification_list.length == 0 ) {
                delete ConferenceUi.open_notifications[image_id];
            } else {
                ConferenceUi.open_notifications[image_id] = new_notification_list;
            }
        }

        // open new entry for this image if needed
        if ( ConferenceUi.open_notifications[ user.viewing.id ] == undefined ) {
            ConferenceUi.open_notifications[ user.viewing.id ] = new Array();
        }
       
        // indicate that the user is viewing this image
        var user_viewing_notification = {type: "viewing",
                                         user: user,
                                         image: user.viewing};
        ConferenceUi.open_notifications[ user.viewing.id ].push( user_viewing_notification );
        
        log("open_notifications:" + ConferenceUi.open_notifications_to_string());
        
        if (update_image != undefined ) {
            ConferenceUi.update_image_notification(update_image);
        }
        ConferenceUi.update_image_notification(user.viewing);
        
    }
};


function remove_user_element_if_present(user) {
    $("#users-list #" + dom_id_from_user(user)).remove();
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
    
    $('#users-list').append(user_wrapper);
});

$(document).bind('user_left', function (ev, user) {
    log("user left: jid: " + user.jid + " nick: " + user.nick);
    remove_user_element_if_present(user);
});


function add_click_event_to_new_image(selector, image) {
    $(selector).click(function() {
        // thumbnail clicked
        log("image thumbnail clicked");
        $(document).trigger('not_following_user');
        $(document).trigger('show_current_image', false);
        $(document).trigger('display_image', image);
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
    
    log("image.delayed: " + image.delayed);
    if (! image.delayed ) {
        // only notify if this is not a message replay (uploaded in the past)
        ConferenceUi.notify_new_image(image);
    }
    
});

$(document).bind('display_image', function(ev, image) {
    log("conference-ui display_image");
    image_element = document.createElement('img');
    $(image_element).attr('src', image.url);
    $(image_element).attr('id', 'displayed-image');
    $(image_element).css('display', 'none');
    $("#image").html(image_element);
    $('#displayed-image').fadeIn('slow', function() {
        // Animation complete
    });
});

$(document).bind('user_update', function(ev, user) {

    // create inner element from template
    user_element = $('#user-inner-template').jqote(user);

    // replace it in the DOM
    $("#users-list #" + dom_id_from_user(user)).html(user_element);
    add_click_event_to_user_viewing("#users-list #" + dom_id_from_user(user) + " a", user);
    
    
    // don't notify if this is ourself.
    if (Conference.nickname != user.nick ) {
        // don't notify if the user is not viewing an image
        if (user.viewing != null ) {
           ConferenceUi.notify_viewing_image(user);
        }
    }
   
    // fade in
    $("#users-list #" + dom_id_from_user(user) + " img").fadeIn('slow', function() {
        // Animation complete
    });
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
    
    $("#join-conference").click(function() {
        var nickname = $("#chosen-nickname").val();
        if (nickname.match(/[^a-zA-Z0-9]/g)) {
            $(document).trigger('enter_nickname', "Only lowercase, uppercase characters and numbers are allowed. No spaces.");
        } else {        
            Conference.join_chatroom(nickname);
        };
    });    
});

$(document).bind('show_current_image', function(ev, fade) {
    log("show_current_image");
    
    $("#now_viewing_button").addClass("active");
    $("#all_images_button").removeClass("active");

    $("#all_images").hide();
    if(fade == true) {
        $("#main_image").fadeIn('slow');
    } else {
       $("#main_image").show();
    }
});

$(document).bind('show_all_images', function(ev, status) {
    log("show_all_images");

    $("#now_viewing_button").removeClass("active");
    $("#all_images_button").addClass("active");

    $("#main_image").hide();
    $("#all_images").fadeIn('slow');
});


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

function viewing_image_notification_dom_id(image) {
    return "image_notification_" + image.id;
};


$(document).bind('following_user', function(ev, user) {
    // indicate we are following user on the task bar
    $("#following_nick").html("following " + user.nick);
});

$(document).bind('not_following_user', function(ev) {
    // indicate we are NOT following user on the task bar
    $("#following_nick").html("");
});

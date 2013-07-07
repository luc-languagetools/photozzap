
// pnotify-specific
var stack_bottomright = {"dir1": "up", "dir2": "left", "firstpos1": 25, "firstpos2": 25};

var ConferenceUi = {

    // indexed by image id
    //  each notification should have the following format:
    //   notification.image: the image concerned
    //   notification.user_added: undefined, or user who uploaded
    //   notification.users_viewing: array of users viewing (can be empty)
    //   notification.comments: array of comments:
    //     comment.user: author
    //     comment.text: comment text
    //   notification.modified: false if the notification hasn't changed, true if it needs to be refreshed
    //   pnotice: pnotify handle

    combined_notifications: {},
    
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
    
        // merge with existing combined notifications
        ConferenceUi.merge_notification( notification );
        
        // perform maintenance on the existing combined notifications
        
        // 1. remove existing open notifications if they were modified
        log("add_notification.1 removing modified combined notifications");
        for( var image_id in ConferenceUi.combined_notifications ) {
            var combined_notification = ConferenceUi.combined_notifications[ image_id ];
            if (combined_notification.modified == true ) {
                ConferenceUi.close_combined_notification( combined_notification );
            }
        }
        
        // 2. cleanup any that need to be cleaned up
        log("add_notification.2 cleanup");
        ConferenceUi.cleanup_combined_notifications();
        
        // 3. re-open any that need to be re-opened
        log("add_notification.3 refresh");
        for( var image_id in ConferenceUi.combined_notifications ) {
            var combined_notification = ConferenceUi.combined_notifications[ image_id ];
            if (combined_notification.modified == true ) {
                ConferenceUi.refresh_combined_notification( combined_notification );
            }
        }        
    },
    
    merge_notification: function( notification ) {
    
        // does a combined notification exist ?
        // if not, create one
        if( ConferenceUi.combined_notifications[ notification.image.id ] == undefined ) {
            ConferenceUi.combined_notifications[ notification.image.id ] = {image: notification.image,
                                                                            user_added: undefined,
                                                                            users_viewing: new Array(),
                                                                            comments: new Array(),
                                                                            modified: true,
                                                                            pnotice: undefined,
                                                                            element_id: undefined,
                                                                            element_id_increment: 0};
        }
        
        if( notification.type == "added" ) {
            ConferenceUi.combined_notifications[ notification.image.id ].user_added = notification.user;
        } else if ( notification.type == "comment" ) {
            ConferenceUi.combined_notifications[ notification.image.id ].comments.push({user: notification.user,
                                                                                        text: notification.text});
        } else if ( notification.type == "viewing" ) {
            // check if the user was viewing any other images before
            
            for (var image_id in ConferenceUi.combined_notifications) {
                var user_viewing_index_of = ConferenceUi.combined_notifications[ image_id ].users_viewing.indexOf(notification.user);
                if (user_viewing_index_of != -1) {
                    // user is already viewing an image
                    // remove that entry
                    ConferenceUi.combined_notifications[ image_id ].users_viewing.splice(user_viewing_index_of, 1);
                    // indicate that the combined notification has changed
                    ConferenceUi.combined_notifications[ image_id ].modified = true;
                }
            }
            
            // add the user in the new image
            ConferenceUi.combined_notifications[ notification.image.id ].users_viewing.push(notification.user);
        }
        
        // mark combined notification as modified
        ConferenceUi.combined_notifications[ notification.image.id ].modified = true;
    },
    
    close_combined_notification: function( combined_notification ) {
        // remove notification
        log("closing combined notification: for: " + combined_notification.image.id);

        // remove pnotice
        if ( combined_notification.pnotice != undefined ) {
            combined_notification.pnotice.pnotify_remove();
        }

    },
    
    cleanup_combined_notifications: function() {
        // remove combined notifications that have no data in them
        
        var image_ids_to_cleanup = new Array();
        for (var image_id in ConferenceUi.combined_notifications) {
            var combined_notification = ConferenceUi.combined_notifications[ image_id ];
            if (combined_notification.modified &&
                combined_notification.user_added == undefined &&
                combined_notification.users_viewing.length == 0 &&
                combined_notification.comments.length == 0) {
                    log("scheduling for cleanup: " + image_id);
                    image_ids_to_cleanup.push(image_id);
                }
        }
        
        for( var i in image_ids_to_cleanup ) {
            delete ConferenceUi.combined_notifications[ image_ids_to_cleanup[i] ];
        }          
    },
    
    pnotify_before_close: function(pnotify) {
        var combined_notification = ConferenceUi.combined_notifications[ pnotify.opts.photozzap_image_id ];
        if ( combined_notification == undefined ) {
            log("ERROR undefined combined_notification for " + pnotify.opts.photozzap_image_id);
        }
        
        if( combined_notification != undefined) {
    
            if( combined_notification.modified == false ) { // only remove if we reached the end of the timeout
                log("deleting combined_notification for " + combined_notification.image.id);
                delete ConferenceUi.combined_notifications[ combined_notification.image.id ];
            }
    
        }    
    },
    
    refresh_combined_notification: function( combined_notification ) {
        // re-display the notification
        log("refreshing combined notification: for: " + combined_notification.image.id);
        // log(ConferenceUi.combined_notification_to_string(combined_notification));
        
        // obtain element id
        combined_notification.element_id = image_notification_dom_id( combined_notification.image ) + "_" + combined_notification.element_id_increment;
        combined_notification.element_id_increment += 1;
        
        // create element and insert
        notification_element = $("#combined-notification-template2").jqote(combined_notification);
        
        // add pnotify notification
        combined_notification.pnotice = $.pnotify({
            title: false,
            text: $(notification_element).html(),
            icon: false,
            type: 'info',
            width: '210px',
            delay: 4000,
            min_height: '160px',
            addclass: "stack-bottomright",
            stack: stack_bottomright,
            before_close: ConferenceUi.pnotify_before_close,
            photozzap_image_id: combined_notification.image.id,
            closer: false,
            sticker: false,
            after_open: function(pnotify) {
                add_click_event_to_new_image("#" + combined_notification.element_id, combined_notification.image);
            }
        });
        
        combined_notification.modified = false;
    },
    
    
    notify_new_image: function(image) {
    
        var notification = {image: image,
                            type: "added",
                            user: image.added_by};
        ConferenceUi.add_notification(notification);
    
    },
    
    notify_viewing_image: function(user) {
        var notification = {image: user.viewing,
                            type: "viewing",
                            user: user};
        ConferenceUi.add_notification(notification);
    },
    
    notify_comment: function(comment) {
        comment['type'] = 'comment';
        ConferenceUi.add_notification(comment);
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
    log("add_click_event_to_new_image, selector: [" + selector + "]");
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
    
    // add comment holder
    var comment_list_obj = {element_id: image_comment_list_dom_id(image)};
    var comment_list_element = $("#comment-list-template").jqote(comment_list_obj);
    $("#comment_list_area").append(comment_list_element);
    
});

$(document).bind('display_image', function(ev, image) {
    log("conference-ui display_image");
    
    // hide main image container
    $("#main_image").hide()
    
    // hide all comments
    $("#comment_list_area .media-list").hide();
    // show the relevant comment area
    $("#comment_list_area #" + image_comment_list_dom_id(image)).show();
    
    
    image_element = document.createElement('img');
    $(image_element).attr('src', image.url);
    $(image_element).attr('id', 'displayed-image');
    //$(image_element).css('display', 'none');
    $("#image").html(image_element);
    $('#main_image').fadeIn('slow', function() {
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
        click_join();
    });
    
    $("#chosen-nickname").keyup(function (e) {
        if (e.keyCode == 13) {
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
    // $("#" + image_comment_list_dom_id(comment.image)).prepend(comment_element).fadeIn();
    $(comment_element).prependTo($("#" + image_comment_list_dom_id(comment.image))).hide().fadeIn();
    
    $("#"+comment.image.thumbnail_id + " .comments-available").css('visibility', '');
    
    if( comment.delayed != true ) {
        ConferenceUi.notify_comment(comment);
    }
});

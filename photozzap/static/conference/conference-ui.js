

var ConferenceUi = {

    new_image_popover_open: false,
    user_viewing_popover_open: false,

    user_viewing_timeouts: {},
    
    notify_new_image: function(image) {
        log("notify_new_image: " + image.id);
    
        if (! ConferenceUi.new_image_popover_open ) {
            // open the popover first
            log("creating new_image_popover element");
            
            new_image_list_element = $("#new-image-popover").jqote();

            $("#all_images_button").popover({title: "<b>New Photos Added</b>", 
                                             content: new_image_list_element,
                                             placement: "bottom",
                                             trigger: "manual",
                                             html: "true"});
            $("#all_images_button").popover('show');
            
            ConferenceUi.new_image_popover_open = true;
        }
    
        // now add the actual images
        image_element = $("#new-image-template").jqote(image);
        
        // add the element to the popover element
        $('#new-image-popover-list').prepend(image_element);

        selector = '#new-image-popover-list #' + image.thumbnail_id;
        a_selector = selector + " a";
        
        // add click event
        add_click_event_to_new_image(a_selector, image);
        
        // add removal timer
        setTimeout(function() {
            selector = '#new-image-popover-list #' + image.thumbnail_id;
        
            // locate the element and remove it
            $(selector).remove();
            
            // how many are left ?
            if ($('#new-image-popover-list').children().length == 0 ) {
                // close the popover
                ConferenceUi.new_image_popover_open = false;
                $("#all_images_button").popover('destroy');                
            }
        
        }, 2500);        
        
    },
    
    notify_viewing_image: function(user) {
        // insert pop-over under "Users"
        log("notify_viewing_image for " + user.nick);
    
        if (! ConferenceUi.user_viewing_popover_open ) {
            // open the popover first
            log("creating user-viewing-popover element");
            
            user_viewing_list_element = $("#user-viewing-popover").jqote();

            $("#users-dropdown").popover({title: "<b>People are looking at</b>", 
                                             content: user_viewing_list_element,
                                             placement: "bottom",
                                             trigger: "manual",
                                             html: "true"});
            $("#users-dropdown").popover('show');
            
            ConferenceUi.user_viewing_popover_open = true;
        }

        selector = user_viewing_popover_selector(user);
        
        // is there already an image displayed ? 
        if ($(selector).length > 0) {
            // remove this image and remove the timeout        
            clearTimeout(ConferenceUi.user_viewing_timeouts[dom_id_from_user_popover(user)]);
            delete ConferenceUi.user_viewing_timeouts[dom_id_from_user_popover(user)];
            $(selector).remove();            
        }
        
        // now add the actual image
        image_element = $("#user-template").jqote({element_id: dom_id_from_user_popover(user), 
                                                   user: user});
        
        // add the element to the popover element
        $('#user-viewing-popover-list').prepend(image_element);

        a_selector = selector + " a";
        
        // add click event
        add_click_event_to_user_viewing(a_selector, user);
        
        // add removal timer
        ConferenceUi.user_viewing_timeouts[dom_id_from_user_popover(user)] = setTimeout(function() {
        
            // remove timeout variable
            delete ConferenceUi.user_viewing_timeouts[dom_id_from_user_popover(user)];
        
            selector = user_viewing_popover_selector(user);
        
            // locate the element and remove it
            $(selector).remove();
            
            // how many are left ?
            if ($('#user-viewing-popover-list').children().length == 0 ) {
                // close the popover
                ConferenceUi.user_viewing_popover_open = false;
                $("#users-dropdown").popover('destroy');                
            }
        
        }, 2500);              
        
        
    },
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
        ConferenceUi.notify_viewing_image(user);
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
    return selector = '#user-viewing-popover-list #' + dom_id_from_user_popover(user);
};


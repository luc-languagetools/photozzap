
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


$(document).bind('new_image', function(ev, image) {
    // create element from template
    image_element = $("#image-template").jqote(image);
   
    //$(image_element).popover({title: "my title", content: "my content"});
    $('#image-list').prepend(image_element);

    $("#image-list #"+image.thumbnail_id + " a").click(function() {
        // thumbnail clicked
        log("image thumbnail clicked");
        $(document).trigger('not_following_user');
        $(document).trigger('display_image', image);
        
    });
    
    var selector_string = "#image-list #"+image.thumbnail_id;
    
    $(selector_string).fadeIn('slow', function() {
        // Animation complete
        // open popover
        if (image.added_by != undefined) {
            $(selector_string).popover({title: "<b>" + image.added_by.nick + " added a photo</b>", 
                                                           content: "click to view",
                                                           placement: "top",
                                                           trigger: "manual",
                                                           html: "true"});
            $(selector_string).popover('show');
        
        
            // hide popover after one second
            setTimeout(function() {
                $(selector_string).popover('destroy');
                
                // insert regular popover
                $(selector_string).popover({title: "<b>Added by " + image.added_by.nick + "</b>", 
                                                               content: "click to view",
                                                               placement: "top",
                                                               trigger: "hover",
                                                               html: "true"});
                //$(selector_string).popover('show');                                                           
                
            }, 1000);
        }
    });
    
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
    
    // add event
    $("#users-list #" + dom_id_from_user(user) + " a").click(function() {
        // thumbnail clicked
        log("image thumbnail clicked");
        $(document).trigger('display_image', user.viewing);
        $(document).trigger('following_user', user);
    });
    
    // insert regular popover
    $("#users-list #" + dom_id_from_user(user)).popover({title: "<b>Click to follow " + user.nick + "</b>", 
                                                   content: "You will see the photos that he is viewing",
                                                   placement: "left",
                                                   trigger: "hover",
                                                   html: "true"});    
    
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
});

$(document).bind('connection_error', function(ev, status) {
    $("#connection-status-text").html(status);
    $('#connection-status-modal').modal('show');
    $("#progress-bar").show();
    $("#choose-nickname-form").hide();
});

$(document).bind('enter_nickname', function(ev, status) {
    // $("#connection-status-text").html(status);
    $("#choose-nickname-form").show();
    $("#connection-status-text").html(status);
    $("#progress-bar").hide();
    
    $("#join-conference").click(function() {
        var nickname = $("#chosen-nickname").val();
        if (nickname.match(/[^a-zA-Z0-9]/g)) {
            $(document).trigger('enter_nickname', "Only lowercase, uppercase characters and numbers are allowed. No spaces.");
        } else {        
            Conference.join_chatroom(nickname);
        };
    });    
});
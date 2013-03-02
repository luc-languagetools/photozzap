
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
   
    $('#image-list').prepend(image_element);

    $("#image-list #"+image.thumbnail_id + " a").click(function() {
        // thumbnail clicked
        log("image thumbnail clicked");
        $(document).trigger('display_image', image);
    });
    
    $("#image-list #"+image.thumbnail_id).fadeIn('slow', function() {
        // Animation complete
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

$(document).bind('user_viewing', function(ev, user) {

    // create inner element from template
    user_element = $('#user-inner-template').jqote(user);

    // replace it in the DOM
    $("#users-list #" + dom_id_from_user(user)).html(user_element);
    
    // add event
    $("#users-list #" + dom_id_from_user(user) + " a").click(function() {
        // thumbnail clicked
        log("image thumbnail clicked");
        $(document).trigger('display_image', user.viewing);
    });
    
    // fade in
    // $("#users-list #" + dom_id_from_user(user) + " a").css("display", "none");
    $("#users-list #" + dom_id_from_user(user) + " img").fadeIn('slow', function() {
        // Animation complete
    });
});
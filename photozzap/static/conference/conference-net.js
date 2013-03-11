
var NS_MUC = "http://jabber.org/protocol/muc";
// var CONF_ROOM = "conf10@conference.photozzap.p1.im";
var CONF_ROOM = "conf2@conference.desktop.dev.jabber.photozzap.com";


var Conference = {
    connection: null,
    nickname: null,
    
    following_user_jid: null,
    
    connected_to_chatroom: false,
    
    users: {},  // indexed by jid
    images: {}, // indexed by image id
    
    queued_events: {}, // indexed by image id
    
    images_loading: {}, // images are placed here until they're loaded
    
    on_ping: function(iq) {
        
        var from = $(iq).attr('from');
        log("ping from: " + from);
        
        var pong = $iq({to: $(iq).attr('from'), type: "result", id: $(iq).attr('id')});
        Conference.connection.send(pong);
        log("sent ping");
        return true;
    },
    
    send_presence_to_chatroom: function() {
        // connect to group chat
        Conference.connection.send(
        $pres({
            to: CONF_ROOM + "/" + Conference.nickname
        }).c('x', {xmlns: NS_MUC}));    
    },
    
    on_presence: function (presence) {
        var from = $(presence).attr('from');
        var room = Strophe.getBareJidFromJid(from);
        var type = $(presence).attr('type');
        var nick = Strophe.getResourceFromJid(from);
        
        if (type == "unavailable") {
            // user disconnected
            // do we have him in the user list ?
            user = Conference.users[from];
            if (user != undefined) {
                delete Conference.users[user.jid];
                $(document).trigger('user_left', user);
            };
        } else if( type != "error") {
        
            if( Conference.connected_to_chatroom == false ) {
                // fully connected
                Conference.connected_to_chatroom = true;
                $(document).trigger('connection_complete', "joined chatroom");
            }
        
            var user = {
                jid: from,
                nick: nick,
                following: null,
            };        
            $(document).trigger('user_joined', user);
            log(user);
            Conference.users[user.jid] = user;
            
        };
        
        //log(presence);
        //log("presence from: " + from + " type: " + type);
        return true;
    },
    
    add_queued_event: function(image_id, event_name, data) {
        var event = {name: event_name,
                     data: data};
        if (Conference.queued_events[image_id] == undefined) {
            // create array
            Conference.queued_events[image_id] = new Array();
        }
        Conference.queued_events[image_id].push(event);
    },
    
    process_queued_events: function(image_id) {
        var queued_events = Conference.queued_events[image_id];
        delete Conference.queued_events[image_id];
        for (var i = 0; i < queued_events.length; i++) {
            event = queued_events[i];
            log("processing event: " + event.name);
            $(document).trigger(event.name, event.data);
        }
    },
    
    on_public_message: function (message) {
        var from = $(message).attr('from');
        var room = Strophe.getBareJidFromJid(from);
        var nick = Strophe.getResourceFromJid(from);
        var body = $(message).children('body').text();
    
        log("message from: " + from + ": " + body);
        
        if (body == "image") {
            // get image url
            var image_url = $(message).children('image').children('url').text();
            var thumbnail = $(message).children('image').children('thumbnail').text();
            var image_id = $(message).children('image').children('id').text();
            var user = Conference.users[from];
            var image = {id: image_id,
                         url: image_url,
                         thumbnail: thumbnail,
                         added_by: user,
                         thumbnail_id: "thumbnail_" + image_id};
                       
            log("received image id " + image_id + ", processing");

            Conference.images_loading[image.id] = image;
            Conference.add_queued_event(image.id, 'new_image', image);
                       
            // setup ajax queries to load the image
            $.get(image.url, function(data) {
                log("image " + image.url + " loaded");
                image_element = document.createElement('img');
                $(image_element).attr('src', image.url);
                $("#image-cache").append(image_element);
                $.get(image.thumbnail, function(data) {
                    log("thumbnail " + image.thumbnail + " loaded");
                    
                    image_element = document.createElement('img');
                    $(image_element).attr('src', image.thumbnail);
                    $("#image-cache").append(image_element);                    
                    
                    // add to images
                    Conference.images[image.id] = image;
                    
                    // remove from images_loading
                    delete Conference.images_loading[image.id];
                    
                    log(Conference.queued_events[image.id]);
                    
                    // any queued events ?
                    Conference.process_queued_events(image.id);
                });
            });
            
        } else if (body == "viewing") {
        
            var image_id = $(message).children('image').children('id').text();
            var image = Conference.images[image_id];
            var user = Conference.users[from];
            // only do this if we've got all the data
            
            if (Conference.images_loading[image_id] != undefined) {
                // image loading - add queued event
                image = Conference.images_loading[image_id];
                user.viewing = image;
                Conference.add_queued_event(image_id, 'user_update', user);
                Conference.add_queued_event(image_id, 'display_image', image);
            } else if (image != undefined && user != undefined) {
                // mark that the user is viewing the data
                user.viewing = image;
                $(document).trigger('user_update', user);
                
                if (Conference.following_user_jid != null &&
                    user.jid == Conference.following_user_jid) {
                    // we are following this user
                    $(document).trigger('display_image', image);
                }
            };
        
        } else if (body == "following" ) {
        
            var user = Conference.users[from];
            var following_jid = $(message).children('following').text();
            
            if (user != undefined && Conference.users[following_jid] != undefined) {
                user.following = Conference.users[following_jid];
                $(document).trigger('user_update', user);
            }
            
        } else if (body == "unfollowing" ) {
            var user = Conference.users[from];
            
            if (user != undefined) {
                user.following = null;
                $(document).trigger('user_update', user);            
            }
        }
        
        return true;
    },
    
    on_private_message: function (message) {
        var from = $(message).attr('from');
        var room = Strophe.getBareJidFromJid(from);
        var nick = Strophe.getResourceFromJid(from)
        var body = $(message).children('body').text();
        
        log("private_message: " + from + " " + body);
        
        return true;
    },
    
    send_group_message: function (msg) {
        message = $msg({
        to: CONF_ROOM,
        type: "groupchat"}).c('body').t(msg);
        Conference.connection.send(message);
    },
    
    follow_user: function (user) {
    
        if( user.nick == Conference.nickname){
            // cannot follow self
            return;
        }
    
        log("following user " + user.jid);
        Conference.following_user_jid = user.jid;
        
        message = $msg({
        to: CONF_ROOM,
        type: "groupchat"});
        message.c('body').t("following").up();
        message.c('following').t(user.jid);
        
        Conference.connection.send(message);
    },
    
    unfollow_user: function() {
        log("not following any users");
        
        if ( Conference.following_user_jid != null ) {
        
            Conference.following_user_jid = null;
            
            message = $msg({
            to: CONF_ROOM,
            type: "groupchat"});
            message.c('body').t("unfollowing");
           
            Conference.connection.send(message);        
        }
    },
    
    send_img_url: function (image) {
        log("send_img_url: " + image.url);
        message = $msg({
        to: CONF_ROOM,
        type: "groupchat"});
        //.c('body').t("image").up().c('image').c('id').t(image.id).up().c('url').t(image.url);
        message.c('body').t("image").up();
        message.c('image').c('id').t(image.id).up().c('url').t(image.url).up().c('thumbnail').t(image.thumbnail);
        log("sending message: " + message);
        Conference.connection.send(message);
    },    
    
    viewing_image: function (image) {
        // notify other users we're viewing this image
        
        log("viewing_image: " + image.id);
        message = $msg({
        to: CONF_ROOM,
        type: "groupchat"});
        message.c('body').t("viewing").up();
        message.c('image').c('id').t(image.id);
        log("sending message: " + message);
        Conference.connection.send(message);
        
    },
    
};

function log(msg) 
{
    // $('#log').append("<p>" + msg + "</p>");
    console.log(msg);
}

function connection_callback(status) {
    log("status: " + status);
    if (status == Strophe.Status.CONNECTED) {
        log("CONNECTED");
        $(document).trigger('connection_status', "Connected, joining conference");
        Conference.send_presence_to_chatroom();
    } else if (status == Strophe.Status.DISCONNECTED) {
        log("DISCONNECTED");
        $(document).trigger('connection_error', "Disconnected");
    } else if (status == Strophe.Status.AUTHENTICATING) {
        log("AUTHENTICATING");
        $(document).trigger('connection_status', "Authenticating");
    } else if (status == Strophe.Status.DISCONNECTING) {
        log("DISCONNECTING");
        $(document).trigger('connection_status', "Disconnecting");
    } else if (status == Strophe.Status.CONNECTING) {
        log("CONNECTING");
        $(document).trigger('connection_status', "Connecting");
    } else if (status == Strophe.Status.CONNFAIL) {
        log("CONNFAIL");
        $(document).trigger('connection_status', "Connection failure");
    } else if (status == Strophe.Status.AUTHFAIL) {
        log("AUTHFAIL");
        $(document).trigger('connection_status', "Authentication failure");
    }
};

function disconnect() {
    log("disconnecting");
    Conference.connection.disconnect();
};

function connection_initialize(username, password, nickname, bosh_service) {
   log("initialize");
   var conn = new Strophe.Connection(bosh_service);
   Conference.connection = conn;
   Conference.nickname = nickname;
   Conference.connection.addHandler(Conference.on_presence, null, "presence");   
   Conference.connection.addHandler(Conference.on_public_message, null, "message", "groupchat");   
   Conference.connection.addHandler(Conference.on_private_message, null, "message", "chat");
   Conference.connection.addHandler(Conference.on_ping, "urn:xmpp:ping", "iq");
   conn.connect(username, password, connection_callback);
}

function dom_id_from_user(user) {
    var result = user.jid.replace(/\@/g, "_");
    result = result.replace(/\//g, "_");
    result = result.replace(/\./g, "_");
    log("replaced jid with: " + result);
    return result;
};

// events

$(document).bind('display_image', function(ev, image) {
    log("conference-net display_image");
    Conference.viewing_image(image);
});

$(document).bind('following_user', function(ev, user) {
    Conference.follow_user(user);
});

$(document).bind('not_following_user', function(ev) {
    Conference.unfollow_user();
});

var NS_MUC = "http://jabber.org/protocol/muc";


var Conference = {
    connection: null,
    nickname: null,
    using_default_nickname: true,
    nickname_change_requested: false,
    
    currently_viewing: null,
    
    following_user_jid: null,
    
    connected_to_chatroom: false,
    
    jid_to_id_mapping: {},
    
    users: {},  // indexed by jid
    images: {}, // indexed by image id
    
    queued_events: {}, // indexed by image id
    
    images_loading: {}, // images are placed here until they're loaded
    
    self_images_in_progress: {},
    
    on_ping: function(iq) {
        
        var from = $(iq).attr('from');
        log("ping from: " + from);
        
        var pong = $iq({to: $(iq).attr('from'), type: "result", id: $(iq).attr('id')});
        Conference.connection.send(pong);
        log("sent ping");
        return true;
    },
    
    join_chatroom: function(nickname) {
        // connect to group chat
        Conference.nickname = nickname;
        // request all history
        var presence_message = $pres({
            to: Conference.room + "/" + Conference.nickname
        }).c('x', {xmlns: NS_MUC}).c('history', {since: "1970-01-01T00:00:00Z"});
        log("sending presence message:");
        log(presence_message);
        Conference.connection.send(presence_message);  
    },
    
    change_nickname: function(new_nickname) {
        Conference.nickname_change_requested = true;
        Conference.join_chatroom(new_nickname);
    },
    
    on_presence: function (presence) {
        log("received presence:")
        log(presence);
    
        var from = $(presence).attr('from');
        var room = Strophe.getBareJidFromJid(from);
        var type = $(presence).attr('type');
        var nick = Strophe.getResourceFromJid(from);
        
        if (type == "error") {
            var error = $(presence).children('error');
            var code = $(error).attr('code');
            if( code == 409 ) {
                // nickname in use
                $(document).trigger('nickname_change_request', "Nickname <b>" + Conference.nickname + "</b> is already in use, choose another one");
            };
            
        } else if (type == "unavailable") {
            // user disconnected
            // do we have him in the user list ?
            user = Conference.users[from];
            if (user != undefined) {
                delete Conference.users[user.jid];
                $(document).trigger('user_left', user);
            };
        } else if( type != "error") {
            // signifies a user is available for communication - can also carry data
        
            if( Conference.connected_to_chatroom == false ) {
                // fully connected
                Conference.connected_to_chatroom = true;
                $(document).trigger('connection_complete', "joined chatroom");
                if( Conference.using_default_nickname ) {
                    $(document).trigger('nickname_change_request', "You have been logged in with the default nickname <b>" + Conference.nickname + "</b>. You may enter your own nickname below");
                }
            } else if (Conference.nickname_change_requested == true && nick == Conference.nickname){
                // nickname change
                $(document).trigger('nickname_change_successful', Conference.nickname);
                Conference.using_default_nickname = false;
            }
        
            // is this a new user to us ?
            if ( Conference.users[from] == undefined ) {
                var user = {
                    jid: from,
                    nick: nick,
                    following: null
                };
                $(document).trigger('user_joined', user);
                log("user joined: " + from);
                Conference.users[user.jid] = user;            
            }
            
            // there might be additional payload in the presence
            Conference.parse_presence_data(presence);
           
        };
        
        return true;
    },
    
    
    parse_presence_data: function(presence) {
        var from = $(presence).attr('from');
    
        if ($(presence).children('viewing').length > 0) {
            var image_id = $(presence).children('viewing').text();
            var image = Conference.images[image_id];
            var user = Conference.users[from];
            
            log("user " + from + " viewing " + image_id);
            
            // only do this if we've got all the data
            user.timestamp = new Date();
           
            if (image != undefined && user != undefined) {
                log("effecting user update now");
                // mark that the user is viewing the data
                user.viewing = image;
                $(document).trigger('user_update', user);
            } else {
                // image not loaded yet, we must defer the event
                Conference.add_user_viewing_queued_event(image_id, user);
            }
        }
    },
    
    display_image_if_following: function(user) {
        // a user is watching a certain image. find out whether we have to follow them
        if (Conference.following_user_jid != null &&
            user.jid == Conference.following_user_jid) {
            // we are following this user
            $(document).trigger('display_image', user.viewing);
        }
    },
    
    add_comment_queued_event: function(image_id, comment_event) {
        var queued_event = {name: "new_comment",
                            special_type: "deferred_comment",
                            data: comment_event,
                            image_id: image_id};
        Conference.add_queued_event_internal(image_id,  queued_event);    
    },
    
    add_user_viewing_queued_event: function(image_id, user) {
        log("adding deferred_user_viewing event for " + user.jid + ", " + image_id);
        var queued_event = {name: "user_update",
                            special_type: "deferred_user_viewing",
                            user: user,
                            image_id: image_id,
                            delayed: false};
        Conference.add_queued_event_internal(image_id,  queued_event);
    },
    
    add_queued_event: function(image_id, event_name, data) {
        var queued_event = {name: event_name,
                            data: data,
                            special_type: ""};
        Conference.add_queued_event_internal(image_id, queued_event);
    },
    
    add_queued_event_internal: function(image_id, queued_event) {
        if (Conference.queued_events[image_id] == undefined) {
            // create array
            Conference.queued_events[image_id] = new Array();
        }
        Conference.queued_events[image_id].push(queued_event);    
    },
    
    process_queued_events: function(image_id) {
        var queued_events = Conference.queued_events[image_id];
        delete Conference.queued_events[image_id];
        for (var i = 0; i < queued_events.length; i++) {
            qevent = queued_events[i];
            
            if (qevent.special_type == "deferred_user_viewing" ) {
                log("constructing deferred_user_viewing");
                // image is loaded by now - lookup image, mark that user is viewing and raise event
                var image = Conference.images[image_id];
                var user = qevent.user;
                user.viewing = image;
                qevent.data = user;
            } else if (qevent.special_type == "deferred_comment" ) {
                var image = Conference.images[image_id];
                qevent.data.image = image;
            }
            
            log("processing event: " + qevent.name);
            $(document).trigger(qevent.name, qevent.data);
        }
    },
    
    on_public_message: function (message) {
        log("on_public_message");
    
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
            var timestamp = new Date(); // assume right now
            var delayed = false;
            if( $(message).children('delay').length > 0 ) {
                timestamp = new Date($(message).children('delay').attr('stamp'));
                delayed = true;
            }
            var user = Conference.users[from];
            var image = {id: image_id,
                         url: image_url,
                         thumbnail: thumbnail,
                         added_by: user,
                         thumbnail_id: "thumbnail_" + image_id,
                         timestamp: timestamp,
                         delayed: delayed};
                       
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
                    
                    // was it an image we uploaded ourselves ?
                    if (Conference.self_images_in_progress[image.id] != undefined) {
                        $(document).trigger('upload_done', image);
                        delete Conference.self_images_in_progress[image.id];
                    }
                    
                    
                    log(Conference.queued_events[image.id]);
                    
                    // any queued events ?
                    Conference.process_queued_events(image.id);
                });
            });
            
        } else if (body == "comment") {
            // comment on an image
            var image_id = $(message).children('image').children('id').text();
            var comment_text = $(message).children('image').children('text').text();
            
            var timestamp = new Date(); // assume right now
            var delayed = false;
            if( $(message).children('delay').length > 0 ) {
                timestamp = new Date($(message).children('delay').attr('stamp'));
                delayed = true;
            }            
            
            var user = Conference.users[from];
            
            var image = Conference.images[image_id];
            if( image != undefined ) {
                var comment_event = {
                    image: image,
                    user: user,
                    nick: nick,
                    text: comment_text,
                    timestamp: timestamp,
                    delayed: delayed
                };
                $(document).trigger('new_comment', comment_event);
            } else {
                // we don't have the image loaded yet, add a queued event
                var comment_event = {
                    image_id: image_id,
                    user: user,
                    nick: nick,
                    text: comment_text,
                    timestamp: timestamp,
                    delayed: delayed
                };
                Conference.add_comment_queued_event(image_id, comment_event);
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
        to: Conference.room,
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
    },
    
    unfollow_user: function() {
        log("not following any users");
        
        if ( Conference.following_user_jid != null ) {
            Conference.following_user_jid = null;
        }
    },
    
    send_comment: function (text) {
        log("sending comment on " + Conference.currently_viewing + ": [" + text + "]");
        
        message = $msg({
        to: Conference.room,
        type: "groupchat"});
        message.c('body').t("comment").up();
        message.c('image').c('id').t(Conference.currently_viewing).up().c('text').t(text);
        log("sending comment: " + message);
        Conference.connection.send(message);        
    },
    
    send_img_url: function (image) {
        log("send_img_url: " + image.url);
        message = $msg({
        to: Conference.room,
        type: "groupchat"});
        message.c('body').t("image").up();
        message.c('image').c('id').t(image.id).up().c('url').t(image.url).up().c('thumbnail').t(image.thumbnail);
        log("sending message: " + message);
        Conference.self_images_in_progress[image.id] = true;
        Conference.connection.send(message);
    },    
    
    viewing_image: function (image) {
        // notify other users we're viewing this image
        
        if (Conference.currently_viewing == image.id) {
            // don't notify twice
            return;
        }
        
        log("viewing_image: " + image.id);
        
        // send viewing as presence
        var message = $pres({
            to: Conference.room + "/" + Conference.nickname
        }).c('viewing').t(image.id);
        
        log("sending message: " + message);
        Conference.connection.send(message);
        
        Conference.currently_viewing = image.id;
    }
    
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
        Conference.join_chatroom("Guest" + randomString(5, '0123456789'));
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

function connection_initialize(username, password, bosh_service, conference_room) {
   log("initialize");
   var conn = new Strophe.Connection(bosh_service);
   Conference.connection = conn;
   Conference.room = conference_room;
   Conference.connection.addHandler(Conference.on_presence, null, "presence");   
   Conference.connection.addHandler(Conference.on_public_message, null, "message", "groupchat");   
   Conference.connection.addHandler(Conference.on_private_message, null, "message", "chat");
   Conference.connection.addHandler(Conference.on_ping, "urn:xmpp:ping", "iq");
   conn.connect(username, password, connection_callback);
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

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

$(document).bind('user_update', function(ev, user) {
    log("conference-net user_update");
    Conference.display_image_if_following(user);
});

$(document).bind('send_comment', function(ev) {
    var comment_text = $("#comment-input").val();
        if( comment_text.length > 0 ) {
        log("send_comment");
        Conference.send_comment(comment_text);
        $("#comment-input").val('');
    }
});

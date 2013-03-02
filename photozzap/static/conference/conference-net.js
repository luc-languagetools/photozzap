
var BOSH_SERVICE = 'https://hosted.im/http-bind';
var NS_MUC = "http://jabber.org/protocol/muc";
var CONF_ROOM = "conf10@conference.photozzap.p1.im";


var Conference = {
    connection: null,
    nickname: null,
    
    users: {},  // indexed by jid
    images: {}, // indexed by image id
    
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
            var user = {
                jid: from,
                nick: nick,
            };        
            $(document).trigger('user_joined', user);
            log(user);
            Conference.users[user.jid] = user;
            
        };
        
        //log(presence);
        //log("presence from: " + from + " type: " + type);
        return true;
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
                        
            log("received image: " + image);
            Conference.images[image.id] = image;
            $(document).trigger('new_image', image);
            // don't display image by default
            // $(document).trigger('display_image', image);
            
        } else if (body == "viewing") {
        
            var image_id = $(message).children('image').children('id').text();
            var image = Conference.images[image_id];
            var user = Conference.users[from];
            // only do this if we've got all the data
            if (image != undefined && user != undefined) {
                // mark that the user is viewing the data
                user.viewing = image;
                $(document).trigger('user_viewing', user);
            };
        
        };
        
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
        Conference.send_presence_to_chatroom();
    } else if (status == Strophe.Status.DISCONNECTED) {
        log("DISCONNECTED");
    } else if (status == Strophe.Status.AUTHENTICATING) {
        log("AUTHENTICATING");
    } else if (status == Strophe.Status.DISCONNECTING) {
        log("DISCONNECTING");
    } else if (status == Strophe.Status.CONNECTING) {
        log("CONNECTING");
    } else if (status == Strophe.Status.CONNFAIL) {
        log("CONNFAIL");
    } else if (status == Strophe.Status.AUTHFAIL) {
        log("AUTHFAIL");
    }
};

function disconnect() {
    log("disconnecting");
    Conference.connection.disconnect();
};

function connection_initialize(username, password, nickname) {
   log("initialize");
   var conn = new Strophe.Connection(BOSH_SERVICE);
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

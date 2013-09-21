

var ConferenceControls = {
    disableToolbarForNotificationTimeout: null,
    hideHistorySidebarAfterReduce: false,
    historySidebarShownOnce: false,
    
    sidebarHandlers: {},
    sidebarOptions: {},
    
    toolbarShown: false,
    disableToolbarTimeout: null,
    mouseOverActionSidebar: false
};


function setupControlHandlers() {
    setupMouseMoveCallback();
    
    $(window).resize(function() {
        resizeHandler();
    });


    // you can expand the sidebars from firebug using:
    // toolbarDebugMode()
    // ConferenceControls.sidebarHandlers.gallery.expandCallback()
    
    ConferenceControls.sidebarHandlers.users = setupUsersSidebar();
    ConferenceControls.sidebarHandlers.gallery = setupGallerySidebar();
    ConferenceControls.sidebarHandlers.chat = setupChatSidebar();
    ConferenceControls.sidebarHandlers.history = setupHistorySidebar();

    $(".action-sidebar").mouseenter(function() {
        ConferenceControls.mouseOverActionSidebar = true;
        // is there a timer to hide toolbar ? if so, cancel it
        if( ConferenceControls.disableToolbarTimeout != null ) {
            // disable previous timeout
            clearTimeout(ConferenceControls.disableToolbarTimeout);
        }           
    });

    $(".action-sidebar").mouseleave(function() {
        ConferenceControls.mouseOverActionSidebar = false;
    }); 
    
}


function setupChatSidebar() {
    ConferenceControls.sidebarOptions.chat = {
        name: "chat",
        main_selector: "#chat-sidebar",
        header_selector: "#chat-sidebar-header",
        content_selector: "#chat-sidebar-content",
        transition_large: {bottom: "5%",
                           left: "10%",
                           height: "50%", 
                           width: "80%"},
        transition_small: {bottom: "10%",
                           left: "42%",
                           height: "15%", 
                           width: "15%"},
        transition_bottom_small: {bottom: "2%",
                                  left: "42%",
                                  height: "15%", 
                                  width: "15%"},  
        expand_queue: 0,
        reduce_queue: 0,
    };
    ConferenceControls.sidebarOptions.chat.transition_resting = ConferenceControls.sidebarOptions.chat.transition_small;
    return setupSidebar(ConferenceControls.sidebarOptions.chat);
}

function setupUsersSidebar() {
    ConferenceControls.sidebarOptions.users = {
        name: "users",
        main_selector: "#users-sidebar",
        header_selector: "#users-sidebar-header",
        content_selector: "#users-sidebar-content",
        transition_large: {top: "15%",
                           left: "5%",
                           height: "80%", 
                           width: "30%"},
        transition_small: {top: "42%",
                           left: "10%",
                           height: "15%", 
                           width: "15%"},
        transition_bottom_small: {top: "83%",
                                  left: "20%",
                                  height: "15%", 
                                  width: "15%"},
        expand_queue: 0,
        reduce_queue: 0,                                  
    };
    ConferenceControls.sidebarOptions.users.transition_resting = ConferenceControls.sidebarOptions.users.transition_small;
    return setupSidebar(ConferenceControls.sidebarOptions.users);
}

function setupHistorySidebar() {
    ConferenceControls.sidebarOptions.history = {
        name: "history",
        main_selector: "#history-sidebar",
        header_selector: "#history-sidebar-header",
        content_selector: "#history-sidebar-content",
        transition_large: {top: "15%",
                          right: "5%",
                          height: "80%", 
                          width: "30%"},
        transition_small: {top: "42%",
                          right: "10%",
                          height: "15%", 
                          width: "15%"},
        transition_bottom_small: {top: "83%",
                                  right: "20%",
                                  height: "15%", 
                                  width: "15%"},
        expand_queue: 0,
        reduce_queue: 0,                                  
    };
    ConferenceControls.sidebarOptions.history.transition_resting = ConferenceControls.sidebarOptions.history.transition_small;
    return setupSidebar(ConferenceControls.sidebarOptions.history);
}


function setupGallerySidebar() {
    ConferenceControls.sidebarOptions.gallery = {
        name: "gallery",
        main_selector: "#gallery-sidebar",
        header_selector: "#gallery-sidebar-header",
        content_selector: "#gallery-sidebar-content",
        transition_large: {top: "10%",
                           left: "5%",
                           height: "70%", 
                           width: "90%"},
        transition_small: {top: "10%",
                           left: "42%",
                           height: "15%", 
                           width: "15%"},
        before_expand: function() {
            // put other sidebars at bottom
            ConferenceControls.sidebarOptions.history.transition_resting = ConferenceControls.sidebarOptions.history.transition_bottom_small;
            ConferenceControls.sidebarOptions.users.transition_resting = ConferenceControls.sidebarOptions.users.transition_bottom_small;            
            ConferenceControls.sidebarOptions.chat.transition_resting = ConferenceControls.sidebarOptions.chat.transition_bottom_small;
            $("#history-sidebar").transition(ConferenceControls.sidebarOptions.history.transition_bottom_small);
            $("#users-sidebar").transition(ConferenceControls.sidebarOptions.users.transition_bottom_small);
            $("#chat-sidebar").transition(ConferenceControls.sidebarOptions.chat.transition_bottom_small);
        },
        before_reduce: function() {
            // restore sidebars to their original location
            ConferenceControls.sidebarOptions.history.transition_resting = ConferenceControls.sidebarOptions.history.transition_small;
            ConferenceControls.sidebarOptions.users.transition_resting = ConferenceControls.sidebarOptions.users.transition_small;            
            ConferenceControls.sidebarOptions.chat.transition_resting = ConferenceControls.sidebarOptions.chat.transition_small;            
            $("#history-sidebar").transition(ConferenceControls.sidebarOptions.history.transition_small);
            $("#users-sidebar").transition(ConferenceControls.sidebarOptions.users.transition_small);
            $("#chat-sidebar").transition(ConferenceControls.sidebarOptions.chat.transition_small);
        },
        expand_queue: 0,
        reduce_queue: 0,
    };
    ConferenceControls.sidebarOptions.gallery.transition_resting = ConferenceControls.sidebarOptions.gallery.transition_small;
    return setupSidebar(ConferenceControls.sidebarOptions.gallery);
}

function setupSidebar(options) {
    // options must have:
    // main_selector (main sidebar div id)
    // header_selector
    // content_selector
    // transition_large (css transition parameters, expanded)
    // transition_small (css transition parameters, reduced)
    
    enlargeFunction = function(options) {
        $(options.main_selector).transition(options.transition_large, function() {
                if ($(options.main_selector).data("mouseon") == true ) {
                    // if the mouse is still on the sidebar,
                    // expand contents inside
              
                    if ($(options.main_selector).data("expanded") != true) {
                        var targetHeight = $(options.main_selector).first().height() -
                                           $(options.header_selector).first().height() - 20;
                        log("setting up slimScroll on sidebar, targetHeight: " + targetHeight);
                        $(options.content_selector).slimScroll({
                            height: targetHeight + 'px',
                            start: 'top',
                            alwaysVisible: true,
                            color: '#FFFFFF',
                            opacity: 1,
                            railVisible: true,
                            railColor: '#FFFFFF',
                            railOpacity: 0.2
                        });
                        $(options.content_selector).fadeIn(250, function() {
                                // nothing to do
                            });
                        $(options.main_selector).data("expanded", true);
                    }
                } 
                ConferenceControls.sidebarOptions[options.name].expand_queue -= 1;
            });    
    };
    
    reduceFunction = function(options) {
        if ($(options.main_selector).data("expanded") == true) {
            // perform transition after fadeout
        
            $(options.content_selector).fadeOut(250, function() {    
                $(options.content_selector).slimScroll({
                                                destroy: true
                                            });
                $(options.main_selector).transition(options.transition_resting, function() {
                    ConferenceControls.sidebarOptions[options.name].reduce_queue -= 1;
                });
            });
            $(options.main_selector).data("expanded", false);
        } else {
            // perform transition right away
            $(options.main_selector).transition(options.transition_resting, function() {
                ConferenceControls.sidebarOptions[options.name].reduce_queue -= 1;
            });
        }    
    }

    enterHandler = function() {
        log("mouseenter [" + options.main_selector + "]");
        if (ConferenceControls.sidebarOptions[options.name].expand_queue >= 1 ) {
            // don't queue up more events
            return;
        }
        ConferenceControls.sidebarOptions[options.name].expand_queue += 1;
        log("expand_queue [" + options.name + "] " + ConferenceControls.sidebarOptions[options.name].expand_queue);
        if (options.before_expand != undefined) {
            options.before_expand();
        }
        $(options.main_selector).data("mouseon", true);
        enlargeFunction(options);
    };
    
    leaveHandler = function() {
        log("mouseleave [" + options.main_selector + "]");
        if (ConferenceControls.sidebarOptions[options.name].reduce_queue >= 1 ) {
            // don't queue up more events
            return;
        }
        ConferenceControls.sidebarOptions[options.name].reduce_queue += 1;
        log("reduce_queue [" + options.name + "] " + ConferenceControls.sidebarOptions[options.name].reduce_queue);
        if (options.before_reduce != undefined) {
            options.before_reduce();
        }    
        $(options.main_selector).data("mouseon", false);
        reduceFunction(options);
    };
    
    $(options.main_selector).mouseenter(enterHandler);
    $(options.main_selector).mouseleave(leaveHandler);    

    var result = {
        expandCallback: enterHandler,
        collapseCallback: leaveHandler,
    };
    
    return result;
    
}

function showToolbar() {
    $("#main_image").transition({ opacity: 0.5 });
    $("#top-navbar").fadeIn(200);
    $(".action-sidebar").fadeTo(200, 1.0);
    // set timeout to restore
    ConferenceControls.toolbarShown = true;
}

function hideToolbar() {
    $("#main_image").transition({ opacity: 1.0 });
    $("#top-navbar").fadeOut(200);
    $(".action-sidebar").fadeTo(200, 0);
    ConferenceControls.toolbarShown = false;
}

$(document).bind('hide_toolbar', function(ev) {
    // temporarily disable mouse move handlers
    removeMouseMoveCallback();
    hideToolbar();
    // restore mouse move handler after a while
    setTimeout(function() {
        setupMouseMoveCallback();
    }, 200);
});



function mouseMoveHandler() {
        log("mouseMoveHandler");

        // if toolbar is not shown, show it and start timeout
        // if toolbar is shown, update timeout 
    
        if ( ! ConferenceControls.toolbarShown ) {
            showToolbar();
        }
        
        if( ConferenceControls.disableToolbarTimeout != null ) {
            // disable previous timeout
            clearTimeout(ConferenceControls.disableToolbarTimeout);
        }           
        
        // only setup timer if we're not over action sidebar
        if ( ! ConferenceControls.mouseOverActionSidebar ) {
            ConferenceControls.disableToolbarTimeout = setTimeout(function() {
                hideToolbar();
                ConferenceControls.disableToolbarTimeout = null;
            }, 1000);
        }
}

function actionSidebarMouseMoveHandler() {
        log("actionSidebarMouseMoveHandler");

        // if toolbar is not shown, show it and start timeout
        // if toolbar is shown, update timeout 
    
        if ( ! ConferenceControls.toolbarShown ) {
            showToolbar();
        }
        
        if( ConferenceControls.disableToolbarTimeout != null ) {
            // disable previous timeout
            clearTimeout(ConferenceControls.disableToolbarTimeout);
        }           
}

function setupMouseMoveCallback() {
    $("#main_image").mousemove(mouseMoveHandler);
    $(".action-sidebar").mousemove(actionSidebarMouseMoveHandler);
}

function removeMouseMoveCallback() {
    $("#main_image").unbind('mousemove');
    $(".action-sidebar").unbind('mousemove');
}

function toolbarDebugMode() {
    removeMouseMoveCallback();
    showToolbar();
}

function displayHistorySidebarForNotification(highlightSelector) {
    log("displayHistorySidebarForNotification");
    if ( $("#history-sidebar").data("expanded") != true ) {
        $(highlightSelector).show();
    } else {
        // history sidebar already expanded - fadein the object
        $(highlightSelector).slideDown(300);
    }

}

function resizeHandler() {
    log("resizeHandler");
    $(document).trigger('resize_image');
};

(function($) {
    $.eventReport = function(selector, root) {
        var s = [];
        $(selector || '*', root).addBack().each(function() {
            // the following line is the only change
            var e = $._data(this, 'events');
            if(!e) return;
            s.push(this.tagName);
            if(this.id) s.push('#', this.id);
            if(this.className) s.push('.', this.className.replace(/ +/g, '.'));
            for(var p in e) {
                var r = e[p],
                    h = r.length - r.delegateCount;
                if(h)
                    s.push('\n', h, ' ', p, ' handler', h > 1 ? 's' : '');
                if(r.delegateCount) {
                    for(var q = 0; q < r.length; q++)
                        if(r[q].selector) s.push('\n', p, ' for ', r[q].selector);
                }
            }
            s.push('\n\n');
        });
        return s.join('');
    }
    $.fn.eventReport = function(selector) {
        return $.eventReport(selector, this);
    }
})(jQuery);


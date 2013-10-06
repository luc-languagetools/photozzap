

var ConferenceControls = {
    disableToolbarForNotificationTimeout: null,
    hideHistorySidebarAfterReduce: false,
    historySidebarShownOnce: false,
    
    sidebarHandlers: {},
    sidebarOptions: {},
    
    toolbarShown: false,
    disableToolbarTimeout: null,
    mouseOverActionSidebar: false,
    touchMode: false,
    resizeToolbarsOnDisplay: false
};


function setupControlHandlers() {
    ConferenceControls.touchMode = Modernizr.touch;
    // for debugging only
    // ConferenceControls.touchMode = false;

    setupMouseMoveCallback();
    
    //resizeHandler();
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
    
    if (! ConferenceControls.touchMode ) {
        $(".action-sidebar").mouseenter(mouseEnterControlElement);
        $(".action-sidebar").mouseleave(mouseLeaveControlElement);
    }
    
}

function mouseEnterControlElement() {
    ConferenceControls.mouseOverActionSidebar = true;
    // is there a timer to hide toolbar ? if so, cancel it
    if( ConferenceControls.disableToolbarTimeout != null ) {
        // disable previous timeout
        clearTimeout(ConferenceControls.disableToolbarTimeout);
    }
}

function mouseLeaveControlElement() {
    ConferenceControls.mouseOverActionSidebar = false;
}

function setupChatSidebar() {
    ConferenceControls.sidebarOptions.chat = {
        name: "chat",
        main_selector: "#chat-sidebar",
        header_selector: "#chat-sidebar-header",
        content_selector: "#chat-sidebar-content",
        footer_selector: "#chat-sidebar-input",
        icon_selector: "#chat-sidebar-icon",
        expanded_class: "chat-sidebar-expanded",
        after_expand: function() {
            $("#chat-sidebar-input").show();
            $("#comment-input").focus();
            $("#status-sidebar").addClass("status-sidebar-other-bars-open");
        },
        before_reduce: function() {
            $("#chat-sidebar-input").hide();
            $("#status-sidebar").removeClass("status-sidebar-other-bars-open");
        },
    };
    return setupSidebar(ConferenceControls.sidebarOptions.chat);
}

function setupUsersSidebar() {
    ConferenceControls.sidebarOptions.users = {
        name: "users",
        main_selector: "#users-sidebar",
        header_selector: "#users-sidebar-header",
        content_selector: "#users-sidebar-content",
        icon_selector: "#users-sidebar-icon",
        expanded_class: "users-sidebar-expanded",
        after_expand: function() {
            $("#gallery-sidebar").addClass("gallery-sidebar-alternate-right");
            $("#status-sidebar").addClass("status-sidebar-alternate-right");
            $("#status-sidebar").addClass("status-sidebar-other-bars-open");
        },
        before_reduce: function() {
            $("#gallery-sidebar").removeClass("gallery-sidebar-alternate-right");
            $("#status-sidebar").removeClass("status-sidebar-alternate-right");
            $("#status-sidebar").removeClass("status-sidebar-other-bars-open");
        },        
    };
    return setupSidebar(ConferenceControls.sidebarOptions.users);
}

function setupHistorySidebar() {
    ConferenceControls.sidebarOptions.history = {
        name: "history",
        main_selector: "#history-sidebar",
        header_selector: "#history-sidebar-header",
        content_selector: "#history-sidebar-content",
        icon_selector: "#history-sidebar-icon",
        expanded_class: "history-sidebar-expanded",
        after_expand: function() {
            $("#gallery-sidebar").addClass("gallery-sidebar-alternate-left");
            $("#status-sidebar").addClass("status-sidebar-alternate-left");
            $("#status-sidebar").addClass("status-sidebar-other-bars-open");
        },
        before_reduce: function() {
            $("#gallery-sidebar").removeClass("gallery-sidebar-alternate-left");
            $("#status-sidebar").removeClass("status-sidebar-alternate-left");
            $("#status-sidebar").removeClass("status-sidebar-other-bars-open");
        },                
    };
    return setupSidebar(ConferenceControls.sidebarOptions.history);
}


function setupGallerySidebar() {
    ConferenceControls.sidebarOptions.gallery = {
        name: "gallery",
        main_selector: "#gallery-sidebar",
        header_selector: "#gallery-sidebar-header",
        content_selector: "#gallery-sidebar-content",
        icon_selector: "#gallery-sidebar-icon",
        expanded_class: "gallery-sidebar-expanded",
        before_expand: function() {
            $("#history-sidebar").addClass("history-sidebar-alternate");
            $("#users-sidebar").addClass("users-sidebar-alternate");
            $("#chat-sidebar").addClass("chat-sidebar-alternate");
            $("#status-sidebar").addClass("status-sidebar-alternate-off");
            $("#status-sidebar").addClass("status-sidebar-other-bars-open");
        },
        before_reduce: function() {
            // restore sidebars to their original location
            $("#history-sidebar").removeClass("history-sidebar-alternate");
            $("#users-sidebar").removeClass("users-sidebar-alternate");
            $("#chat-sidebar").removeClass("chat-sidebar-alternate");
            $("#status-sidebar").removeClass("status-sidebar-alternate-off");
            $("#status-sidebar").removeClass("status-sidebar-other-bars-open");
        },
    };
    return setupSidebar(ConferenceControls.sidebarOptions.gallery);
}

function setupSidebar(options) {
    // options must have:
    // main_selector (main sidebar div id)
    // header_selector
    // content_selector
    // expanded_class
    
    // set the sidebar name
    $(options.main_selector).data("sidebar-name", options.name);
    
    enlargeFunction = function(options) {
        $(options.header_selector).removeClass("action-sidebar-header-centered");
        $(options.main_selector).addClass("action-sidebar-expanded");
        $(options.icon_selector).addClass("action-siderbar-inactive-selected");
        $(options.icon_selector).on('click', function(){ 
            closeAllSidebars()
        });
        $(options.main_selector).one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {

                // if the mouse is still on the sidebar,
                // expand contents inside
          
                if (options.after_expand != undefined) {
                    options.after_expand();
                }
                                            
                if ($(options.main_selector).data("expanded") != true) {

                    setupSidebarContentSlimscroll(options.main_selector, options.header_selector, options.footer_selector, options.content_selector);
                    
                    $(options.content_selector).fadeIn(250, function() {
                            // nothing to do
                        });
                    $(options.main_selector).data("expanded", true);
                }
                    
            });    
        $(options.main_selector).addClass(options.expanded_class);
            
    };
    
    $(options.main_selector).on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {    
        if (ConferenceControls.resizeToolbarsOnDisplay == true &&
            $(options.main_selector).data("expanded") == true) {
            log("resizing " + options.name + " after CSS transition");
            // saw a CSS transition while sidebar was expanded - adjust slimscroll
            removeSidebarContentSlimscroll(options.content_selector);
            setupSidebarContentSlimscroll(options.main_selector, options.header_selector, options.footer_selector, options.content_selector);            
            ConferenceControls.resizeToolbarsOnDisplay = false;
        }
    });    
   
    reduceFunction = function(options) {
        $(options.header_selector).addClass("action-sidebar-header-centered");
        $(options.icon_selector).removeClass("action-siderbar-inactive-selected");
        $(options.icon_selector).unbind('click');
       
        // perform transition after fadeout
    
        $(options.content_selector).fadeOut(250, function() {    
            removeSidebarContentSlimscroll(options.content_selector);
                                        
            $(options.main_selector).removeClass(options.expanded_class);
        });
        $(options.main_selector).data("expanded", false);
        $(options.main_selector).removeClass("action-sidebar-expanded");
    }

    resizeContentFunction = function() {
        log("resizing content for " + options.name);
        removeSidebarContentSlimscroll(options.content_selector);
        setupSidebarContentSlimscroll(options.main_selector, options.header_selector, options.footer_selector, options.content_selector);
    }
    
    expandHandler = function(event) {
        log("expandHandler [" + options.main_selector + "]");

        if ($(options.main_selector).data("expanded") == true) {
            // don't do anything
            return;
        }
       
        // close all previously open sidebars
        closeAllSidebars();
        
        if (options.before_expand != undefined) {
            options.before_expand();
        }
        enlargeFunction(options);
    };
    
    collapseHandler = function() {
        log("collapseHandler [" + options.main_selector + "]");

        if (options.before_reduce != undefined) {
            options.before_reduce();
        }    
        reduceFunction(options);

    };

    $(options.main_selector).on('click', expandHandler);

    var result = {
        expandCallback: expandHandler,
        collapseCallback: collapseHandler,
        resizeCallback: resizeContentFunction,
    };
    
    return result;
    
}

function setupSidebarContentSlimscroll(main_selector, header_selector, footer_selector, content_selector) {
    var total_height = $(main_selector).first().height();
    var header_height = $(header_selector).first().height();
    var footer_height = 0;
    var targetHeight = total_height - header_height - 20;
    if (footer_selector != undefined) {
        var footer_height = $(footer_selector).first().height();
        targetHeight -= footer_height;
    }
    log("setting up slimScroll on sidebar , targetHeight: " + targetHeight +
        " total_height: " + total_height +
        " header_height: " + header_height +
        " footer_height: " + footer_height);
    $(content_selector).slimScroll({
        height: targetHeight + 'px',
        start: 'top',
        alwaysVisible: true,
        color: '#FFFFFF',
        opacity: 1,
        railVisible: true,
        railColor: '#FFFFFF',
        railOpacity: 0.2
    });
}

function removeSidebarContentSlimscroll(content_selector) {
        $(content_selector).slimScroll({
                            destroy: true
                        });
}

function closeAllSidebars() {
    $(".action-sidebar-active").each(function() {
        if( $(this).data("expanded") == true ) {
            var name = $(this).data("sidebar-name");
            log("sidebar " + name + " is expanded");
            ConferenceControls.sidebarHandlers[name].collapseCallback();
        }
    });
    
}

function controlsResize() {
    // either resize right now, or queue the resize
    // the resize only makes sense if elements are displayed, otherwise the browser does not know what
    // then new sizes are
    
    // resize right now, but also schedule a resize for later
    resizeAllOpenSidebars();
    ConferenceControls.resizeToolbarsOnDisplay = true;
}

function resizeAllOpenSidebars() {
    $(".action-sidebar-active").each(function() {
        if( $(this).data("expanded") == true ) {
            var name = $(this).data("sidebar-name");
            log("sidebar " + name + " is expanded");
            ConferenceControls.sidebarHandlers[name].resizeCallback();
        }
    });
}

function showToolbar() {
    $("#main_image").transition({ opacity: 0.5 });
    $(".action-sidebar").fadeIn(200, function() {
        if( ConferenceControls.resizeToolbarsOnDisplay ) {
            resizeAllOpenSidebars();
            ConferenceControls.resizeToolbarsOnDisplay = false;
        }
    });
    // set timeout to restore
    ConferenceControls.toolbarShown = true;
}

function hideToolbar() {
    $("#main_image").transition({ opacity: 1.0 });
    $(".action-sidebar").fadeOut(200);
    ConferenceControls.toolbarShown = false;
}

$(document).bind('hide_toolbar', function(ev) {
    hideToolbar();
    if (! ConferenceControls.touchMode ) {
        // temporarily disable mouse move handlers
        removeMouseMoveCallback();    
        // restore mouse move handler after a while
        setTimeout(function() {
            setupMouseMoveCallback();
        }, 1000);
    }
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
    if (ConferenceControls.touchMode) {
        $("#control_event_layer").on("click", function() {
            // if toolbar is not shown, show toolbar
            // if toolbar is shown,
            //   if any sidebars expanded, close them
            //   if no sidebars expanded, hide toolbar

            if ( ! ConferenceControls.toolbarShown ) {
                log("no sidebars open, and toolbar not shown, show toolbar");
                showToolbar();
            } else {
                var open_sidebars = $(".action-sidebar-expanded");
                if (open_sidebars.length > 0) {                
                    log("one sidebar open, close all sidebars");
                    closeAllSidebars();                
                } else {
                    log("no sidebars open, and toolbar shown, hide toolbar");
                    hideToolbar();
                }
            }
        });
    } else {
        $("#control_event_layer").mousemove(mouseMoveHandler);
        $(".action-sidebar").mousemove(actionSidebarMouseMoveHandler);
        $("#control_event_layer").on("click", function() {
            // close sidebars
            closeAllSidebars();
        });        
    }
}

function removeMouseMoveCallback() {
    if( ! ConferenceControls.touchMode ) {
        $("#control_event_layer").unbind('mousemove');
        $(".action-sidebar").unbind('mousemove');
    }
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
    controlsResize();
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


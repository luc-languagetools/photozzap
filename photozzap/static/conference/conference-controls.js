

var ConferenceControls = {
    disableToolbarForNotificationTimeout: null,
    hideHistorySidebarAfterReduce: false,
    historySidebarShownOnce: false,
    
    sidebarHandlers: {},
    sidebarOptions: {},
    
    toolbarShown: false,
    disableToolbarTimeout: null,
    mouseOverActionSidebar: false,
    touchMode: false
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
    
    if (! ConferenceControls.touchMode ) {
        $(".action-sidebar").mouseenter(mouseEnterControlElement);
        $(".action-sidebar").mouseleave(mouseLeaveControlElement);
        $("#top-navbar").mouseenter(mouseEnterControlElement);
        $("#top-navbar").mouseleave(mouseLeaveControlElement);
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
        expanded_class: "chat-sidebar-expanded",
        after_expand: function() {
            $("#chat-sidebar-input").show();
            $("#comment-input").focus();
        },
        before_reduce: function() {
            $("#chat-sidebar-input").hide();
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
        expanded_class: "users-sidebar-expanded",
    };
    return setupSidebar(ConferenceControls.sidebarOptions.users);
}

function setupHistorySidebar() {
    ConferenceControls.sidebarOptions.history = {
        name: "history",
        main_selector: "#history-sidebar",
        header_selector: "#history-sidebar-header",
        content_selector: "#history-sidebar-content",
        expanded_class: "history-sidebar-expanded",
    };
    return setupSidebar(ConferenceControls.sidebarOptions.history);
}


function setupGallerySidebar() {
    ConferenceControls.sidebarOptions.gallery = {
        name: "gallery",
        main_selector: "#gallery-sidebar",
        header_selector: "#gallery-sidebar-header",
        content_selector: "#gallery-sidebar-content",
        expanded_class: "gallery-sidebar-expanded",
        before_expand: function() {
            $("#history-sidebar").addClass("history-sidebar-alternate");
            $("#users-sidebar").addClass("users-sidebar-alternate");
            $("#chat-sidebar").addClass("chat-sidebar-alternate");
        },
        before_reduce: function() {
            // restore sidebars to their original location
            $("#history-sidebar").removeClass("history-sidebar-alternate");
            $("#users-sidebar").removeClass("users-sidebar-alternate");
            $("#chat-sidebar").removeClass("chat-sidebar-alternate");
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
        $(options.main_selector).one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {

                // if the mouse is still on the sidebar,
                // expand contents inside
          
                if (options.after_expand != undefined) {
                    options.after_expand();
                }
                                            
                if ($(options.main_selector).data("expanded") != true) {
                    var targetHeight = $(options.main_selector).first().height() -
                                       $(options.header_selector).first().height() - 20;
                    if (options.footer_selector != undefined) {
                        targetHeight -= $(options.footer_selector).first().height();
                    }
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
                    
            });    
        $(options.main_selector).addClass(options.expanded_class);
            
    };
    
    reduceFunction = function(options) {
        $(options.header_selector).addClass("action-sidebar-header-centered");

        // perform transition after fadeout
    
        $(options.content_selector).fadeOut(250, function() {    
            $(options.content_selector).slimScroll({
                                            destroy: true
                                        });
                                        
            $(options.main_selector).removeClass(options.expanded_class);
        });
        $(options.main_selector).data("expanded", false);
        $(options.main_selector).removeClass("action-sidebar-expanded");
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
    };
    
    return result;
    
}

function closeAllSidebars() {
    $(".action-sidebar").each(function() {
        if( $(this).data("expanded") == true ) {
            var name = $(this).data("sidebar-name");
            log("sidebar " + name + " is expanded");
            ConferenceControls.sidebarHandlers[name].collapseCallback();
        }
    });
    
}

function showToolbar() {
    $("#main_image").transition({ opacity: 0.5 });
    $("#top-navbar").fadeIn(200);
    $(".action-sidebar").fadeIn(200);
    // set timeout to restore
    ConferenceControls.toolbarShown = true;
}

function hideToolbar() {
    $("#main_image").transition({ opacity: 1.0 });
    $("#top-navbar").fadeOut(200);
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
        }, 200);
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
        $("#main_image").on("click", function() {
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
        $("#main_image").mousemove(mouseMoveHandler);
        $(".action-sidebar").mousemove(actionSidebarMouseMoveHandler);
        $("#main_image").on("click", function() {
            // close sidebars
            closeAllSidebars();
        });        
    }
}

function removeMouseMoveCallback() {
    if( ! ConferenceControls.touchMode ) {
        $("#main_image").unbind('mousemove');
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


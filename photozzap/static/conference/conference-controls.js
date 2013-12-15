

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
    resizeToolbarsOnDisplay: false,
    firstResizePerformed: false
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
    };
    return setupSlidingSidebar(ConferenceControls.sidebarOptions.chat);
}

function setupUsersSidebar() {
    ConferenceControls.sidebarOptions.users = {
        name: "users",
        main_selector: "#users-sidebar",
        header_selector: "#users-sidebar-header",
        content_selector: "#users-sidebar-content",
    };
    return setupSlidingSidebar(ConferenceControls.sidebarOptions.users);
}

function setupHistorySidebar() {
    ConferenceControls.sidebarOptions.history = {
        name: "history",
        main_selector: "#history-sidebar",
        header_selector: "#history-sidebar-header",
        content_selector: "#history-sidebar-content",
    };
    return setupSlidingSidebar(ConferenceControls.sidebarOptions.history);
}


function setupGallerySidebar() {
    ConferenceControls.sidebarOptions.gallery = {
        name: "gallery",
        main_selector: "#gallery-sidebar",
        header_selector: "#gallery-sidebar-header",
        content_selector: "#gallery-sidebar-content",
    };
    return setupSlidingSidebar(ConferenceControls.sidebarOptions.gallery);
}


function setupSlidingSidebar(options) {
    // options must have:
    // main_selector (main sidebar div id)
    // header_selector
    // content_selector
    // footer_selector
    // expanded_class
    
    // set the sidebar name
    $(options.main_selector).data("sidebar-name", options.name);
    
    // expand sidebar right away
    setupSidebarContentSlimscroll(options.main_selector, options.header_selector, options.footer_selector, options.content_selector);
    
    resizeContentFunction = function() {
        log("resizing content for " + options.name);
        removeSidebarContentSlimscroll(options.content_selector);
        setupSidebarContentSlimscroll(options.main_selector, options.header_selector, options.footer_selector, options.content_selector);
    }
    
    var result = {
        resizeCallback: resizeContentFunction,
        expandCallback: function() {},
        collapseCallback: function() {},
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
    log("setting up slimScroll on sidebar [" + main_selector + "] , targetHeight: " + targetHeight +
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
    $(document).trigger('close_all_sidebars');
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
        var name = $(this).data("sidebar-name");
        log("sidebar " + name + " is expanded, resizing");
        ConferenceControls.sidebarHandlers[name].resizeCallback();
    });
}

function showToolbar() {
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
        // log("mouseMoveHandler");

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
        // log("actionSidebarMouseMoveHandler");

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
        $("#mouse_event_layer").on("click", function() {
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
        $("#mouse_event_layer").mousemove(mouseMoveHandler);
        $(".action-sidebar").mousemove(actionSidebarMouseMoveHandler);
        $("#mouse_event_layer").on("click", function() {
            // close sidebars
            closeAllSidebars();
        });        
    }
}

function removeMouseMoveCallback() {
    if( ! ConferenceControls.touchMode ) {
        $("#mouse_event_layer").unbind('mousemove');
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

$(document).bind('display_image', function(ev, image) {
    if( ! ConferenceControls.firstResizePerformed ) {
        resizeHandler();
        ConferenceControls.firstResizePerformed = true;
    }
});

function resizeHandler() {
    log("resizeHandler");
    $(document).trigger('resize_image');
    controlsResize();
}

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


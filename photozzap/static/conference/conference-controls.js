

var ConferenceControls = {
    disableToolbarForNotificationTimeout: null,
    hideHistorySidebarAfterReduce: false,
    historySidebarShownOnce: false,
    
    sidebarHandlers: {},
    sidebarOptions: {},
    
    toolbarShown: false,
    disableToolbarTimeout: null,
    touchMode: false,
    resizeToolbarsOnDisplay: false,
    firstResizePerformed: false,
    
    pointerMode: false,
    
    useTranslate3d: has3d()
};


function setupControlHandlers() {
    ConferenceControls.touchMode = Modernizr.touch;
    // for debugging only
    ConferenceControls.touchMode = true;
    
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

    // need to handle "unfocus" from the text input as the ipad doesn't resize well
    // after typing a comment
    setupTextInputUnfocusEvent();
    
    // listener for swipe events
    if( ConferenceControls.touchMode ) {
        var swipeOptions=
        {
            triggerOnTouchEnd : true,        
            swipeStatus : swipeStatus,
            tap: clickMouseEventLayerInTouchMode,
            threshold:75,
            cancelThreshold:10            
        };
     
        $("#mouse_event_layer").swipe( swipeOptions );
    }
    
    
    $("#pointer-mode-icon").click(togglePointerMode);
    
}

function swipeStatus(event, phase, direction, distance)
{
    //If we are moving before swipe, and we are going Lor R in X mode, or U or D in Y mode then drag.
    if( phase=="move" && (direction=="left" || direction=="right") )
    {
        if( ConferenceUi.swipe_transition_in_progress ) {
            // don't drag picture, wait until current transition is done
            return;
        }
    
        log("swipeStatus move " + direction);
        $("#displayed_image").css("opacity", 0.0);
        $("#swipe_images").css("opacity", 1.0);
        var translateX = getDefaultTranslateX();
        if (direction == "left") {
            ConferenceUi.swipe_already_translated = -distance;
            translateX -= distance;
        } else if (direction == "right") {
            ConferenceUi.swipe_already_translated = distance;
            translateX += distance;
        }
        performTranslateX(translateX);
            
    }
    
    else if ( phase == "cancel")
    {
        if( ConferenceUi.swipe_transition_in_progress ) {
            // don't drag picture, wait until current transition is done
            return;
        }    
    
        log("swipeStatus cancel");
        cancel_swipe_transition();
    }
    
    else if ( phase =="end" )
    {
        if( ConferenceUi.swipe_transition_in_progress ) {
            // don't drag picture, wait until current transition is done
            return;
        }    
    
        if (direction == "left") {
            if( Conference.image_data.next_image != undefined ) {
                selectImageAndTransition(Conference.image_data.next_image, true);
            } else {
                cancel_swipe_transition();
            }
        } else if (direction == "right") {
            if ( Conference.image_data.prev_image != undefined) {
                selectImageAndTransition(Conference.image_data.prev_image, false);
            } else {
                cancel_swipe_transition();
            }
        }
    }
}

function selectImageAndTransition(image, is_next) {
    $("#displayed_image").css("opacity", 0.0);
    
    var after_transition = function() {
        $(document).trigger('not_following_user');
        $(document).trigger('show_current_image', false);
        $(document).trigger('display_image', image);
    };
    
    if (image != undefined) {
        if( is_next ) {
            transition_next(after_transition);
        } else {
            transition_prev(after_transition);
        }
    }
}

function setupTextInputUnfocusEvent() {

    $("#comment-input").on('blur', function(ev) {
        // resize in 500ms
        setTimeout(function() {
                window.scrollTo(0, 1);
                resizeHandler();
            }, 800);
    })

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
    $(document).trigger('set_interface_visible', true);
    // set timeout to restore
    ConferenceControls.toolbarShown = true;
}

function hideToolbar() {
    ConferenceControls.toolbarShown = false;
    $(document).trigger('set_interface_visible', false);
}

$(document).bind('hide_toolbar', function(ev) {
    hideToolbar();
});


function togglePointerMode(event) {
    log("togglePointerMode");
    if( event != undefined ) {
        event.stopImmediatePropagation();
    }
    ConferenceControls.pointerMode = ! ConferenceControls.pointerMode;
    if (ConferenceControls.pointerMode) {
        if( ! ConferenceControls.touchMode ) {
            $("#control_event_layer").css("cursor", "pointer");
            $("#user-pointer").show();
            $("#control_event_layer").mousemove(pointerMouseMoveHandler);
        }
        $("#control_event_layer").on("click", pointerMouseClickHandler);
    } else {
        if( ! ConferenceControls.touchMode ) {
            $("#control_event_layer").css("cursor", "auto");
            $("#user-pointer").hide();
            $("#control_event_layer").unbind('mousemove'); 
        }
        $("#control_event_layer").unbind("click");
    }
    return false;
}

function pointerMouseClickHandler(event) {
    log("pointer click: " + event.pageX + ", " + event.pageY);

    var offset = $("#displayed_image img").offset();
    
    var adjustedX = event.pageX - offset.left;
    var adjustedY = event.pageY - offset.top;
    
    var percentX = adjustedX / $("#displayed_image img").width();
    var percentY = adjustedY / $("#displayed_image img").height();
    
    Conference.send_pointer_location(percentX, percentY);
    
    togglePointerMode();
}

function pointerMouseMoveHandler(event) {
    // update pointer location
    // event.pageX, event.pageY
    $("#user-pointer").css({top: event.pageY, left: event.pageX});
}

function mouseMoveHandler(event) {
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

        ConferenceControls.disableToolbarTimeout = setTimeout(function() {
            hideToolbar();
            ConferenceControls.disableToolbarTimeout = null;
        }, 2000);

}

function clickMouseEventLayerInTouchMode() {
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
}

function setupMouseMoveCallback() {
    if (ConferenceControls.touchMode) {
        $("#mouse_event_layer").on("click", clickMouseEventLayerInTouchMode);
    } else {
        $("#mouse_event_layer").mousemove(mouseMoveHandler);
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
        // disable menu
        $(document).trigger('toggle_menu_visible');
        if (ConferenceControls.touchMode) {
            $(document).trigger('show_intro');
            hideToolbar();
        }
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

function has3d() {
    return ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
}

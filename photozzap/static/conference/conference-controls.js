var toolbarShown = false;
var disableToolbarTimeout = null;


var ConferenceControls = {
    disableToolbarForNotificationTimeout: null,
    hideHistorySidebarAfterReduce: false,
    historySidebarShownOnce: false,
    
    sidebarHandlers: {},
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

	$("#history-sidebar").mouseenter(function() {
        ConferenceControls.historySidebarShownOnce = true;
    
        if (ConferenceControls.disableToolbarForNotificationTimeout != null) {
            // disable timeout function, a new one will be created
            clearTimeout(ConferenceControls.disableToolbarForNotificationTimeout);
            ConferenceControls.disableToolbarForNotificationTimeout = null;
        }    
    
        // remove inverse color if present
        $("#history-sidebar").removeClass("action-sidebar-inverse");
    
        $("#history-sidebar").data("mouseon", true);
		enlargeHistorySidebar(null);
	});	
	
	$("#history-sidebar").mouseleave(function() {
        $("#history-sidebar").data("mouseon", false);
		reduceHistorySidebar();
	});
	

	$("#chat-sidebar").mouseenter(function() {
		$("#chat-sidebar").transition({bottom: "5%",
									   left: "10%",
									   height: "50%", 
									   width: "80%"}, function() {
											/*
											var targetHeight = $("#history-sidebar").first().height() - 40;
											$('#history-sidebar-content').slimScroll({
												height: targetHeight + 'px'
											});											
											*/
											$("#chat-sidebar-content").show();
										  });	
	});

	$("#chat-sidebar").mouseleave(function() {
		$("#chat-sidebar-content").hide();
		$("#chat-sidebar").transition({bottom: "10%",
										  left: "42%",
										  height: "15%", 
										  width: "15%"});	
	});


	$(".action-sidebar").mouseenter(function() {
		removeMouseMoveCallback();
	});

	$(".action-sidebar").mouseleave(function() {
		setupMouseMoveCallback();
	});	
	
}

function setupUsersSidebar() {
    var options = {
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
    };
    return setupSidebar(options);
}

function setupGallerySidebar() {
    var options = {
        main_selector: "#gallery-sidebar",
        header_selector: "#gallery-sidebar-header",
        content_selector: "#gallery-sidebar-content",
        transition_large: {top: "10%",
                           left: "5%",
                           height: "80%", 
                           width: "90%"},
        transition_small: {top: "10%",
                           left: "42%",
                           height: "15%", 
                           width: "15%"},
        before_expand: function() {
            // hide other sidebars
            $("#history-sidebar").hide();
            $("#users-sidebar").hide();
            $("#chat-sidebar").hide();
        },
        before_reduce: function() {
            // restore other sidebars
            $("#history-sidebar").show();
            $("#users-sidebar").show();
            $("#chat-sidebar").show();        
        },
    };
    return setupSidebar(options);
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
            });    
    };
    
    reduceFunction = function(options) {
        if ($(options.main_selector).data("expanded") == true) {
            // perform transition after fadeout
        
            $(options.content_selector).fadeOut(250, function() {    
                $(options.content_selector).slimScroll({
                                                destroy: true
                                            });
                $(options.main_selector).transition(options.transition_small);
            });
            $(options.main_selector).data("expanded", false);
        } else {
            // perform transition right away
            $(options.main_selector).transition(options.transition_small);
        }    
    }

    enterHandler = function() {
        log("mouseenter [" + options.main_selector + "]");
        if (options.before_expand != undefined) {
            options.before_expand();
        }
        $(options.main_selector).data("mouseon", true);
        enlargeFunction(options);
    };
    
    leaveHandler = function() {
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
    $("#top-navbar").fadeIn();
    $(".action-sidebar").fadeIn();
    // set timeout to restore
    toolbarShown = true;
}

function hideToolbar() {
    $("#main_image").transition({ opacity: 1.0 });
    $("#top-navbar").fadeOut();
    $(".action-sidebar").fadeOut();
    toolbarShown = false;
}

$(document).bind('hide_toolbar', function(ev) {
    hideToolbar();
});

function setupMouseMoveCallback() {
	$("#main_image").mousemove(function() {
	
		// if toolbar is not shown, show it and start timeout
		// if toolbar is shown, update timeout 
	
		if ( ! toolbarShown ) {
            showToolbar();
		}
		
		if( disableToolbarTimeout != null ) {
			// disable previous timeout
			clearTimeout(disableToolbarTimeout);
		}			
		
		disableToolbarTimeout = setTimeout(function() {
            hideToolbar();
			disableToolbarTimeout = null;
		}, 1000);
	});
}

function toolbarDebugMode() {
    removeMouseMoveCallback();
    showToolbar();
}


function removeMouseMoveCallback() {
	$("#main_image").unbind('mousemove');
	
	if( disableToolbarTimeout != null ) {
		// disable previous timeout
		clearTimeout(disableToolbarTimeout);
		disableToolbarTimeout = null;
	}	
}

function slideDownHistoryElement(highlightSelector) {
    // speed up animations if many elements are being shown at once
    
    // $(highlightSelector).show();
    $(highlightSelector).slideDown(300);
    /*
    ConferenceControls.numHistoryElementsAnimated += 1;
    log("numHistoryElementsAnimated: " + ConferenceControls.numHistoryElementsAnimated);
    var duration = 400;
    if (ConferenceControls.numHistoryElementsAnimated > 1) {
        duration = 50;
    }
    $(highlightSelector).slideDown(duration, function(){ 
        ConferenceControls.numHistoryElementsAnimated -= 1;
    });    
    */
}

function enlargeHistorySidebar(highlightSelector) {
    log("enlargeHistorySidebar");
	$("#history-sidebar").transition({top: "15%",
									  right: "5%",
									  height: "80%", 
									  width: "30%"}, function() {
                                      
                                        if ($("#history-sidebar").data("mouseon") == true ) {
                                            // if the mouse is still on the history sidebar,
                                            // expand contents inside
                                      
                                            if ($("#history-sidebar").data("expanded") != true) {
                                                var targetHeight = $("#history-sidebar").first().height() -
                                                                   $("#history-sidebar-header").first().height() - 20;
                                                log("enlargeHistorySidebar targetHeight: " + targetHeight);
                                                $('#history-sidebar-content').slimScroll({
                                                    height: targetHeight + 'px',
                                                    start: 'top',
                                                    alwaysVisible: true,
                                                    color: '#FFFFFF',
                                                    opacity: 1,
                                                    railVisible: true,
                                                    railColor: '#FFFFFF',
                                                    railOpacity: 0.2
                                                });
                                                $("#history-sidebar-content").fadeIn(250, function() {
                                                    if (highlightSelector != null ) {
                                                        // need to flash an element
                                                        slideDownHistoryElement(highlightSelector);
                                                    }
                                                });
                                                $("#history-sidebar").data("expanded", true);
                                            } else {
                                                // sidebar already expanded, only need to slide down the new element
                                                if (highlightSelector != null ) {
                                                    // need to flash an element
                                                    slideDownHistoryElement(highlightSelector);
                                                }                                                
                                            }
                                      
                                        } else {
                                            // we still need to display the new notification if present
                                            if (highlightSelector != null ) {
                                                // need to flash an element
                                                slideDownHistoryElement(highlightSelector);
                                            }
                                        }
									  });
}


function reduceHistorySidebar() {
    // remove slimscroll
    log("reduceHistorySidebar");
    
    if ($("#history-sidebar").data("expanded") == true) {
        // perform transition after fadeout
    
        $("#history-sidebar-content").fadeOut(250, function() {    
            $('#history-sidebar-content').slimScroll({
                                            destroy: true
                                        });
            reduceHistorySidebarTransition();
        });
        $("#history-sidebar").data("expanded", false);
    } else {
        // perform transition right away
        reduceHistorySidebarTransition();
    }
    
                                        
}


function reduceHistorySidebarTransition() {
    $("#history-sidebar").transition({top: "42%",
                                      right: "10%",
                                      height: "15%", 
                                      width: "15%"}, function() {
                                        log("reduceHistorySidebar finished transition");
                                        if (ConferenceControls.hideHistorySidebarAfterReduce) {
                                            $("#history-sidebar").hide();
                                            ConferenceControls.hideHistorySidebarAfterReduce = false;
                                            // remove inverse color if present
                                            $("#history-sidebar").removeClass("action-sidebar-inverse");
                                        }
                                      });
}

function displayHistorySidebarForNotification(highlightSelector) {
    log("displayHistorySidebarForNotification");

	// bring up history sidebar if we're not already in the timeout period
    if (ConferenceControls.historySidebarShownOnce == false) {
        // show make the notification visible, don't expand the history sidebar
        // this is to prevent many events showing up right after connecting
        $(highlightSelector).show();
    } else if ( $("#history-sidebar").data("expanded") != true ) {
        $("#history-sidebar").data("mouseon", true);
        $("#history-sidebar").addClass("action-sidebar-inverse");
        $("#history-sidebar").show();
		enlargeHistorySidebar(highlightSelector);
	} else {
        // history sidebar already expanded - fadein the object
        slideDownHistoryElement(highlightSelector);
    }
	
    // start timeout to close the history sidebar
    
    if (ConferenceControls.disableToolbarForNotificationTimeout != null) {
        // disable timeout function, a new one will be created
        clearTimeout(ConferenceControls.disableToolbarForNotificationTimeout);
        ConferenceControls.disableToolbarForNotificationTimeout = null;
    }
    
    ConferenceControls.disableToolbarForNotificationTimeout = setTimeout(function() {
        $("#history-sidebar").data("mouseon", false);
        ConferenceControls.hideHistorySidebarAfterReduce = true;
        ConferenceControls.disableToolbarForNotificationTimeout = null;
		reduceHistorySidebar();
    }, 3000);

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


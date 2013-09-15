var toolbarShown = false;
var disableToolbarTimeout = null;


var ConferenceControls = {
    disableToolbarForNotificationTimeout: null,
    hideHistorySidebarAfterReduce: false,
    historySidebarShownOnce: false,
};

function setupControlHandlers() {
	setupMouseMoveCallback();
	
    $(window).resize(function() {
        resizeHandler();
    });
    
	$('#image-list').slimScroll({
		height: "auto"
	});	

	$("#users-sidebar").mouseenter(function() {
        $("#users-sidebar").data("mouseon", true);
		 enlargeUsersSidebar();
	});

	$("#users-sidebar").mouseleave(function() {
        $("#users-sidebar").data("mouseon", false);
		reduceUsersSidebar();
	});		
	
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


function enlargeUsersSidebar() {
		$("#users-sidebar").transition({top: "15%",
										  left: "5%",
										  height: "80%", 
										  width: "30%"}, function() {
                                      
                                        if ($("#users-sidebar").data("mouseon") == true ) {
                                            // if the mouse is still on the sidebar,
                                            // expand contents inside
                                      
                                            if ($("#users-sidebar").data("expanded") != true) {
                                                var targetHeight = $("#users-sidebar").first().height() -
                                                                   $("#users-sidebar-header").first().height() - 20;
                                                log("setting up slimScroll on users-sidebar, targetHeight: " + targetHeight);
                                                $('#users-sidebar-content').slimScroll({
                                                    height: targetHeight + 'px',
                                                    start: 'top',
                                                    alwaysVisible: true,
                                                    color: '#FFFFFF',
                                                    opacity: 1,
                                                    railVisible: true,
                                                    railColor: '#FFFFFF',
                                                    railOpacity: 0.2
                                                });											
                                                $("#users-sidebar-content").fadeIn(250, function() {
                                                        // nothing to do
                                                    });
                                                $("#users-sidebar").data("expanded", true);
                                            }
                                        } 
									  });
}

function reduceUsersSidebar() {
    
    if ($("#users-sidebar").data("expanded") == true) {
        // perform transition after fadeout
    
        $("#users-sidebar-content").fadeOut(250, function() {    
            $('#users-sidebar-content').slimScroll({
                                            destroy: true
                                        });
            reduceUsersSidebarTransition();
        });
        $("#users-sidebar").data("expanded", false);
    } else {
        // perform transition right away
        reduceUsersSidebarTransition();
    }
}

function reduceUsersSidebarTransition() {
    $("#users-sidebar").transition({top: "42%",
                                      left: "10%",
                                      height: "15%", 
                                      width: "15%"});
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
	
	// resize the slimscroll on #all_images
	$('#image-list').slimScroll({
		height: "auto"
	});		
	
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


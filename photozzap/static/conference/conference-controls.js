var toolbarShown = false;
var disableToolbarTimeout = null;

var disableToolbarForNotificationTimeout = null;

var ConferenceControls = {

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
		$("#users-sidebar").transition({top: "15%",
										  left: "5%",
										  height: "80%", 
										  width: "30%"}, function() {
											var targetHeight = $("#users-sidebar").first().height() - 40;
											$('#users-sidebar-content').slimScroll({
												height: targetHeight + 'px',
                                                alwaysVisible: true,
                                                color: '#FFFFFF'
											});											
											$("#users-sidebar-content").show();
											
										  });
	});

	$("#users-sidebar").mouseleave(function() {
		$("#users-sidebar-content").hide();
		$("#users-sidebar").transition({top: "42%",
										  left: "10%",
										  height: "15%", 
										  width: "15%"});
	});		
	
	$("#history-sidebar").mouseenter(function() {
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

function setupMouseMoveCallback() {
	$("#main_image").mousemove(function() {
	
		// if toolbar is not shown, show it and start timeout
		// if toolbar is shown, update timeout 
	
		if ( ! toolbarShown ) {
			$("#main_image").transition({ opacity: 0.5 });
			$("#top-navbar").fadeIn();
			$(".action-sidebar").fadeIn();
			// set timeout to restore
			toolbarShown = true;
		}
		
		if( disableToolbarTimeout != null ) {
			// disable previous timeout
			clearTimeout(disableToolbarTimeout);
		}			
		
		disableToolbarTimeout = setTimeout(function() {
				$("#main_image").transition({ opacity: 1.0 });
				$("#top-navbar").fadeOut();
				$(".action-sidebar").fadeOut();
				toolbarShown = false;
				disableToolbarTimeout = null;
		}, 1000);
	});
}


function removeMouseMoveCallback() {
	$("#main_image").unbind('mousemove');
	
	if( disableToolbarTimeout != null ) {
		// disable previous timeout
		clearTimeout(disableToolbarTimeout);
		disableToolbarTimeout = null;
	}	
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
                                      
                                            if ($("#history-sidebar").data("expanded") == true) {
                                                // already expanded ? we must destroy the slimscroll before creating a new one
                                                $('#history-sidebar-content').slimScroll({
                                                                                destroy: true
                                                                            }); 
                                            }
                                      
                                            log("enlargeHistorySidebar finished transition");
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
                                                    // $(highlightSelector).fadeIn();
                                                    //$(highlightSelector).fadeTo('fast', 1);
                                                    log("fading in selector: [" + highlightSelector + "]");
                                                    //$(highlightSelector).fadeTo(600, 1);
                                                    $(highlightSelector).slideDown();
                                                }
                                            });
                                            $("#history-sidebar").data("expanded", true);
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
                                      });
}

function displayHistorySidebarForNotification(highlightSelector) {
    log("displayHistorySidebarForNotification");

	// bring up history sidebar if we're not already in the timeout period
	if ( $("#history-sidebar").data("expanded") != true ) {
        $("#history-sidebar").data("mouseon", true);
        $("#history-sidebar").show();
		enlargeHistorySidebar(highlightSelector);
	} else {
        // history sidebar already expanded - fadein the object
        // $(highlightSelector).fadeTo(600, 1);
        $(highlightSelector).slideDown();
    }
	
    // todo: enable timeout
    /*
	if (disableToolbarForNotificationTimeout != null ) {
		// disable existing timeout function, a new one will be created
		clearTimeout(disableToolbarForNotificationTimeout);
		disableToolbarForNotificationTimeout = null;
	}
	
	disableToolbarForNotificationTimeout = setTimeout(function() {
		reduceHistorySidebar();
		$("#history-sidebar").hide();
		disableToolbarForNotificationTimeout = null;
	}, 2000);
    */
}

function resizeHandler() {
	log("resizeHandler");
	$(document).trigger('resize_image');
	
	// resize the slimscroll on #all_images
	$('#image-list').slimScroll({
		height: "auto"
	});		
	
};
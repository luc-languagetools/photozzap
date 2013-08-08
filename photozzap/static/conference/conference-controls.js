var toolbarShown = false;
var disableToolbarTimeout = null;

var disableToolbarForNotificationTimeout = null;

function setupControlHandlers() {
	setupMouseMoveCallback();
	
	$("#users-sidebar").mouseenter(function() {
		$("#users-sidebar").transition({top: "15%",
										  left: "5%",
										  height: "80%", 
										  width: "30%"}, function() {
											var targetHeight = $("#users-sidebar").first().height() - 40;
											$('#users-sidebar-content').slimScroll({
												height: targetHeight + 'px'
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
		enlargeHistorySidebar();
	});	
	
	$("#history-sidebar").mouseleave(function() {
		// destroySlimscroll("history-sidebar-content");
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



function enlargeHistorySidebar() {
	$("#history-sidebar").transition({top: "15%",
									  right: "5%",
									  height: "80%", 
									  width: "30%"}, function() {
										var targetHeight = $("#history-sidebar").first().height() - 40;
										$('#history-sidebar-content').slimScroll({
											height: targetHeight + 'px',
											start: 'top'
										});											
										$("#history-sidebar-content").show();
									  });
}


function reduceHistorySidebar() {
	$("#history-sidebar-content").hide();
	$("#history-sidebar").transition({top: "42%",
									  right: "10%",
									  height: "15%", 
									  width: "15%"});
}



function displayHistorySidebarForNotification() {

	// bring up history sidebar if we're not already in the timeout period
	if ( disableToolbarForNotificationTimeout == null ) {
		$("#history-sidebar").show();
		enlargeHistorySidebar();
	}
	
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
}


function destroySlimscroll(objectId) { 
	$("#"+objectId).parent().replaceWith($("#"+objectId)); 
}	

function resizeHandler() {
	$(document).trigger('resize_image');
};
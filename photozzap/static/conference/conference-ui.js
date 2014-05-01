var CloudinaryGlobal = {
};

function show_progress_bar() {
    $("#progress-bar .bar").css("width", "0%");
    $("#progress-bar-label").html("Uploading image(s)"); 
    $("#progress-container").fadeIn();
}

function hide_progress_bar() {
    $("#progress-container").fadeOut();
    $("#progress-bar-label").html("");
}

function update_progress_bar(e, data) { 
    $("#progress-bar .bar").css('width', Math.round((data.loaded * 100.0) / data.total) + '%'); 
}

String.prototype.trunc = String.prototype.trunc ||
      function(n){
          return this.length>n ? this.substr(0,n-1)+'&hellip;' : this;
      };

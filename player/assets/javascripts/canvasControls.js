var createCanvasControls = function(video, canvas, playPauseBtn, uiControls, currentTimeTxt, totalTimeTxt, seekCtrl, volumeBtn, volumeCtrl, zoomOutBtn, zoomCtrl, zoomInBtn, fullscreenBtn) {
    var ctx = canvas.getContext('2d');
    var scaleFactor = 1.1;
    var zoomFactor = 1;
    var maxZoom = 7;
    var cw = 640;
    var ch = 360;


    video.addEventListener('play', function(){
        draw(this,ctx,cw,ch);
    },false);
    setCanvasControlsListeners();
    trackTransforms(ctx);
    redraw(video,ctx,cw,ch);	
    var lastX=canvas.width/2, lastY=canvas.height/2;
    var dragStart,dragged;
    canvas.addEventListener('mousedown',mouseDown,false);
    canvas.addEventListener('mousemove',mouseMove,false);
    canvas.addEventListener('mouseup',mouseUp,false);
    canvas.addEventListener('DOMMouseScroll',handleScroll,false);
    canvas.addEventListener('mousewheel',handleScroll,false);

    function mouseDown(evt){
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragStart = ctx.transformedPoint(lastX,lastY);
        dragged = false;
    }

    function mouseMove(evt){
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragged = true;
        if (dragStart){
            translate(video, ctx, dragStart, lastX, lastY, cw, ch);
        }
    }
    function mouseUp(evt){
        dragStart = null;
        //if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
    }

    /* Prints the current transformation matrix (rotation not used)
    ** scale_x, scale_y \n translation_x, translation_y  */
    function printMat() {
        console.log(ctx.getTransform().a + ", " + ctx.getTransform().d);
        console.log(ctx.getTransform().e + ", " + 
                   ctx.getTransform().f);
        console.log("width: " + cw*ctx.getTransform().a);
        console.log("height: " + ch *ctx.getTransform().a);
        console.log("______");
    }
    function handleScroll(evt){
        var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
        if (delta) {
            //updateZoomUI();
            //updateSliderUI(zoomCtrl);
            zoom(video, ctx, delta, lastX, lastY, zoomCtrl, maxZoom, scaleFactor, cw, ch);
            updateZoomUI();
        }
        return evt.preventDefault() && false;
    }
   //ctx, clicks, x, y, button, maxZoom)


    /* functions for UI controls */

    // an object variable to store volume to toggle between states
    var previousVolume;
    var isFullScreen = false;

    /* create event listeners for canvas controls */
    function setCanvasControlsListeners() {
        // Add event listeners
        video.addEventListener('loadedmetadata',getVideoLength,false);
        video.addEventListener('timeupdate',updateSeekTime,false);
        seekCtrl.addEventListener('change',videoSeek,false);
        playPauseBtn.addEventListener('click',function(){
            playPauseVideo(video);
        },false);
        video.addEventListener('pause',function(){
            changeToPauseState(playPauseBtn, uiControls);
        },false);
        video.addEventListener('play',function(){
            changeToPlayState(playPauseBtn, uiControls);
        },false);
        volumeBtn.addEventListener('click',function(){
            toggleMuteState(event, video, volumeCtrl, previousVolume);
            updateSliderUI(volumeCtrl);
        },false);
        volumeCtrl.addEventListener('change',function(){
            volumeAdjust(previousVolume, video, volumeBtn, volumeCtrl);
            updateSliderUI(volumeCtrl);
        },false);
        video.addEventListener('volumechange',updateSliderUI(volumeCtrl),false);
        volumeCtrl.addEventListener('mousemove',function(){
          updateSliderUI(volumeCtrl);
        },false);
        zoomInBtn.addEventListener('click',zoomIn,false);
        zoomOutBtn.addEventListener('click',zoomOut,false);
        zoomCtrl.addEventListener('change',zoomAdjust,false);
        zoomCtrl.addEventListener('mousemove',function(){
          updateSliderUI(zoomCtrl);
        },false);
        fullscreenBtn.addEventListener('click',function(){
            isFullScreen = toggleFullScreen(fullscreenBtn, isFullScreen);
        },false);

        // Set default values for video volume
        video.volume = 0.5;
        previousVolume = {
            state: 'low',
            value: video.volume
        };
    }

    /* Retrieve total duration of video and update total time text */
    function getVideoLength() {
        var convertedTotalTime = convertSecondsToHMS(video.duration);
        totalTimeTxt.innerHTML = convertedTotalTime;
    }

    /* Update seek control value and current time text */
    function updateSeekTime(){    
        var newTime = video.currentTime/video.duration;
        var gradient = ['to right'];
        var buffered = video.buffered;

        seekCtrl.value = newTime;

        if (buffered.length == 0) {
        gradient.push('rgba(255, 255, 255, 0.1) 0%');
        } else {
        // NOTE: the fallback to zero eliminates NaN.
        var bufferStartFraction = (buffered.start(0) / video.duration) || 0;
        var bufferEndFraction = (buffered.end(0) / video.duration) || 0;
        var playheadFraction = (video.currentTime / video.duration) || 0;
        gradient.push('rgba(255, 255, 255, 0.1) ' + (bufferStartFraction * 100) + '%');
        gradient.push('rgba(255, 255, 255, 0.7) ' + (bufferStartFraction * 100) + '%');
        gradient.push('rgba(255, 255, 255, 0.7) ' + (playheadFraction * 100) + '%');
        gradient.push('rgba(255, 255, 255, 0.4) ' + (playheadFraction * 100) + '%');
        gradient.push('rgba(255, 255, 255, 0.4) ' + (bufferEndFraction * 100) + '%');
        gradient.push('rgba(255, 255, 255, 0.1) ' + (bufferEndFraction * 100) + '%');
        }
        seekCtrl.style.background = 'linear-gradient(' + gradient.join(',') + ')';

        updateCurrentTimeText(video.currentTime);
    }

    /* Change current video time and text according to seek control value */
    function videoSeek(){
        var seekTo = video.duration * seekCtrl.value;
        video.currentTime = seekTo;

        updateCurrentTimeText(video.currentTime);
    }

    /* Convert and update current time text */
    function updateCurrentTimeText(time) {
        var convertedTime = convertSecondsToHMS(time);
        currentTimeTxt.innerHTML = convertedTime;
    }

    /* Update zoom control UI */
    function updateZoomUI() {
        zoomCtrl.value = convertScaleToPercent(ctx.getTransform().a, maxZoom);
        updateSliderUI(zoomCtrl);
    }

    /* Update slider color when slider value changes - for zoomCtrl/volumeCtrl */
    function updateSliderUI(element) {
        var gradient = ['to right'];
        gradient.push('#ccc ' + (element.value * 100) + '%');
        gradient.push('rgba(255, 255, 255, 0.3) ' + (element.value * 100) + '%');
        gradient.push('rgba(255, 255, 255, 0.3) 100%');
        element.style.background = 'linear-gradient(' + gradient.join(',') + ')';
    }

    /* General function to call zoom(clicks,x,y) from the UI Controls. */
    function zoomHelper(value) {
        var tx = ctx.getTransform().e;
        var ty = ctx.getTransform().f;
        var old_s = ctx.getTransform().a;
        var x = cw/2;
        var y = ch/2;
        zoom(video, ctx, value, x, y, zoomCtrl, maxZoom, scaleFactor, cw, ch);
        updateZoomUI();
    }
    /* Adjust zoom by adjusting the slider */
    function zoomAdjust() {
        var zoomPercent = zoomCtrl.value;
        var new_s = convertPercentToScale(zoomPercent, maxZoom);
        var old_s = ctx.getTransform().a;
        var delta_clicks = Math.log(new_s/old_s) /Math.log(scaleFactor);
        zoomHelper(delta_clicks); 
    }
    
    /* Adjust zoom by clicking zoom in and out buttons */
    function zoomIn() {
        zoomHelper(1);
    }
    function zoomOut() {
        zoomHelper(-1);
    }

    /* function to track key press events */
    $(document).keyup(function(e) {
        if (e.keyCode == 27) { // escape key maps to keycode `27`
            if (isFullScreen)   // if escape key pressed on full screen, call function to update player size
                isFullScreen = toggleFullScreen(fullscreenBtn, isFullScreen);
        }
    });
};

/* Play or pause the video */
function playPauseVideo(video) {
    if(video.paused)
        video.play();
    else 
        video.pause();
}

/* Updates icon to "play" button during pause state, show UI controls bar */
function changeToPauseState(playPauseBtn, uiControls) {
    playPauseBtn.className = 'play';
    uiControls.className = '';
}

/* Updates icon to "pause" button during play state, hide UI controls bar */
function changeToPlayState(playPauseBtn, uiControls) {
    playPauseBtn.className = 'pause';
    uiControls.className = 'hideOnHover';
}

/* Adjust volume using volume control and update UI and mute state */
function volumeAdjust(previousVolume, video, volumeBtn, volumeCtrl) {
    video.volume = volumeCtrl.value;

    if (video.volume > 0) {
        video.muted = false;
        if (video.volume > 0.5)
            volumeBtn.className = 'high';
        else
            volumeBtn.className = 'low';
    }
    else {
        video.muted = true;
        volumeBtn.className = 'off';
    }

    // update previous state at the end so mute can be toggled correctly
    previousVolume.value = video.volume;
    previousVolume.state = volumeBtn.className;
}

/* Toggle mute on or off, saves previous states of volume and its value */
function toggleMuteState(evt, video, volumeCtrl, previousVolume) {
    // temporary variables to store current volume values
    var currentVolumeState = evt.target.className;
    var currentVolumeControlValue = video.volume;

    if (currentVolumeState == 'low' || currentVolumeState == 'high') {
        evt.target.className = 'off';
        video.muted = true;
        volumeCtrl.value = 0;
        video.volume = 0;
    }
    else {
        evt.target.className = previousVolume.state;
        video.muted = false;
        volumeCtrl.value = previousVolume.value;
        video.volume = previousVolume.value;
    }

    // update previous state
    previousVolume.state = currentVolumeState;
    previousVolume.value = currentVolumeControlValue;
}

function toggleFullScreen(fullscreenBtn, isFullScreen) {
    if (!isFullScreen) {
        // set canvas player area to full screen
        var player = document.getElementById('canvasPlayerArea');
        if (player.webkitRequestFullScreen)
            player.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);   // for chrome and safari

        else if (player.mozRequestFullScreen)
            player.mozRequestFullScreen();  // firefox

        else if (player.msRequestFullScreen)
            player.msRequestFullScreen();  // IE

        else
            player.requestFullscreen();     // standard

        // adjust size of canvas player area to fill entire width & height
        $('#canvasPlayerArea').width($(window).width());
        $('#canvasPlayerArea').height($(window).height());

        // add "exit" class to full screen button to change icon
        fullscreenBtn.className = 'exit';
        // add "fs-adjust" class to zoom control area to reposition zoom controls
        $('#zoomBarControls').addClass('fs-adjust');

        // update variable
        isFullScreen = true;
    }
    else {
        // exit from fullscreen
        if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        else if (document.mozCancelFullscreen)
            document.mozCancelFullscreen();
        else if (document.msExitFullscreen)
            document.msExitFullscreen();
        else
            document.exitFullscreen();

        // adjust size of canvas player area back to original size
        $('#canvasPlayerArea').width(640);
        $('#canvasPlayerArea').height(360);

        // remove "exit" class from full screen button to change icon
        fullscreenBtn.className = '';
        // remove "fs-adjust" class from zoom control area to reposition zoom controls
        $('#zoomBarControls').removeClass('fs-adjust');

        // update variable
        isFullScreen = false;
    }
    return isFullScreen;
}

/* Function to converts seconds to HH:MM:SS format */
function convertSecondsToHMS(timeInSeconds) {
    var formattedTime = '';
    var hours = Math.floor(timeInSeconds / 3600);
    var mins = Math.floor((timeInSeconds / 60) % 60);
    var secs = Math.floor(timeInSeconds % 60);

    if (secs < 10) 
        secs = '0' + secs;
    if (mins < 10)
        mins = '0' + mins;

    formattedTime = hours+':'+mins+':'+secs;

    return formattedTime; 
}

function draw(v,c,w,h) {
    //if(v.paused || v.ended) return false;
    c.drawImage(v,0,0,w,h);
    setTimeout(draw,20,v,c,w,h);
}

function redraw(video,ctx,cw,ch){
    // Clear the entire canvas
    var p1 = ctx.transformedPoint(0,0);
    var p2 = ctx.transformedPoint(canvas.width,canvas.height);
    //ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
    // Alternatively:
    // ctx.save();
    // ctx.setTransform(1,0,0,1,0,0);
    // ctx.clearRect(0,0,canvas.width,canvas.height);
    // ctx.restore();
    draw(video,ctx,cw,ch);
}

function translate(video, ctx, dragStart, lastX, lastY, cw, ch) {
    var pt = ctx.transformedPoint(lastX,lastY);
    var dx = pt.x-dragStart.x;
    var dy = pt.y-dragStart.y;
    var tx = ctx.getTransform().e;
    var ty = ctx.getTransform().f;
    var flag = 0;
    var s = ctx.getTransform().a;
    if (tx+dx <= 0 && tx+cw*s+dx > cw) { 
            ctx.translate(dx,0);
            flag = 1;
    }
    if (ty+dy <= 0 && ty+ch*s+dy > ch) {
            ctx.translate(0,dy);
            flag = 1;
    }
   /* if (flag = 0) {
        ctx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
    }*/
    redraw(video, ctx, cw, ch);   
}

/* Zooms into the position x, y with the amount clicks */
function zoom(video, ctx, clicks, x, y, button, maxZoom, scaleFactor, cw, ch){
    //tt(ctx);
    var pt = ctx.transformedPoint(x, y);
    var factor = Math.pow(scaleFactor,clicks);
    var tx = ctx.getTransform().e;
    var ty = ctx.getTransform().f;
    var s = ctx.getTransform().a;
    if (factor*s >= 1 && factor*s <= maxZoom) {
        ctx.translate(pt.x,pt.y);
        ctx.scale(factor,factor);
        ctx.translate(-pt.x,-pt.y);
        button.value = convertScaleToPercent(ctx.getTransform().a, maxZoom);
        refit(ctx, maxZoom, cw, ch);
    }
    redraw(video,ctx,cw,ch); 
}


/* Checks if the viewport borders intersect with the canvas borders
** If it intersects, then scale/translate back the canvas accordingly to fit the viewport.*/
function refit(ctx, maxZoom, cw, ch) {
    var tx = ctx.getTransform().e;
    var ty = ctx.getTransform().f;
    var s = ctx.getTransform().a;
    console.log("zoom: " + s);
    if (s < 1 || s > maxZoom) {
        ctx.scale(1/s, 1/s);    
    }
    if (tx > 0 ) {
        ctx.translate(-tx,0);
    }
    if (ty > 0) {
        ctx.translate(0,-ty);
    }
    if (tx+cw*s < cw) {
        var dx = cw - tx-cw*s;
        var sum =tx+cw*s;
        ctx.translate(dx, 0);
    } 
    if (ty+ch*s < ch) {
        var dy = ch - ty-ch*s;
        ctx.translate(0, dy);
    }
}

function trackTransforms(ctx){
    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function(){ return xform; };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function(){
        savedTransforms.push(xform.translate(0,0));
        return save.call(ctx);
    };
    var restore = ctx.restore;
    ctx.restore = function(){
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function(sx,sy){
        xform = xform.scaleNonUniform(sx,sy);
        return scale.call(ctx,sx,sy);
    };
    var rotate = ctx.rotate;
    ctx.rotate = function(radians){
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(ctx,radians);
    };
    var translate = ctx.translate;
    ctx.translate = function(dx,dy){
        xform = xform.translate(dx,dy);
        return translate.call(ctx,dx,dy);
    };
    var transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
        var m2 = svg.createSVGMatrix();
        m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
        xform = xform.multiply(m2);
        return transform.call(ctx,a,b,c,d,e,f);
    };
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a,b,c,d,e,f){
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx,a,b,c,d,e,f);
    };
    var pt  = svg.createSVGPoint();
    ctx.transformedPoint = function(x,y){
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
    }
}

/* Helper methods to convert between the slider values and transformation matrix values */
    function convertPercentToScale(percent, maxZoom) {
        var range = maxZoom - 1;
        return percent*range + 1;
    }
    function convertScaleToPercent(scale, maxZoom) {
        var range = maxZoom - 1;
        return (scale-1)/range;
    }
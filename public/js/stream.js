/*(function(){
    var video = document.getElementById('player'),
        vendorUrl = window.URL || window.webkitURL;
    
    navigator.getMedia = (navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);

    if(navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream){
            console.log(stream);
            video.src = vendorUrl.createObjectURL(stream);
            video.play();
        })
        .catch(function(err){
            console.log('MD ni, '+err);
        });
    }
    else{
        // Capture Video
        navigator.getMedia({ video: true, audio: false },
            function(stream){
                console.log(stream);
                video.src = vendorUrl.createObjectURL(stream);
                video.play();
            },
            function(error){
                console.log('Error Code: '+error.code+'\n Error Message: '+error);
            }
        );
    }
})();*/

    var video = document.getElementById('player');
    var recorder;

    // When the user clicks on start video recording
    document.getElementById('btn-start-recording').addEventListener("click", function(){
        // Disable start recording button
        this.disabled = true;

        // Request access to the media devices
        navigator.mediaDevices.getUserMedia({
            audio: true, 
            video: true
        }).then(function(stream) {
            // Display a live preview on the video element of the page
            //setSrcObject(stream, video);
            video.src = URL.createObjectURL(stream);

            // Start to display the preview on the video element
            // and mute the video to disable the echo issue !
            video.play();
            video.muted = true;

            // Initialize the recorder
            recorder = new RecordRTCPromisesHandler(stream, {
                mimeType: 'video/webm',
                bitsPerSecond: 128000
            });

            // Start recording the video
            recorder.startRecording().then(function() {
                console.info('Recording video ...');
            }).catch(function(error) {
                console.error('Cannot start video recording: ', error);
            });

            // release stream on stopRecording
            recorder.stream = stream;

            // Enable stop recording button
            document.getElementById('btn-stop-recording').disabled = false;
        }).catch(function(error) {
            console.error("Cannot access media devices: ", error);
        });
    }, false);

    // When the user clicks on Stop video recording
    document.getElementById('btn-stop-recording').addEventListener("click", function(){
        this.disabled = true;

        recorder.stopRecording().then(function() {
            console.info('stopRecording success');

            // Retrieve recorded video as blob and display in the preview element
            var blob = recorder.getBlob();
            var videoSrc = URL.createObjectURL(blob);
            console.log('SRC: '+videoSrc+' | Blob: '+blob);

            video.src = videoSrc;
            video.play();

            // Unmute video on preview
            video.muted = false;

            // Stop the device streaming
            recorder.stream.stop();

            /*var file = new File([blob], 'video.webm', {
                type: 'video/webm'
            });
            xhr('/service/upload', file);*/
            xhr('/service/upload', blob);

            // Enable record button again !
            document.getElementById('btn-start-recording').disabled = false;
        }).catch(function(error) {
            console.error('stopRecording failure', error);
        });
    }, false);

    // Helper function to send 
    function xhr(url, data) {
        var request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                console.log("Video succesfully uploaded !");
            }
        };

        request.open('POST', url);

        var formData = new FormData();
        formData.append('filename', 'video.webm');
        formData.append('video', data);

        request.send(formData);
    }
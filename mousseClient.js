define(function(){
  // Client: Maximum SSE update failures
  var MAX_UPDATE_FAILURES = 2;

  // Client: How many failures we've had so far
  var updateFailureCount = 0;

  // Listen for server sent events
  var listen = function(url, receiveMessage, maxFailures, handleOldBrowsers){
    // Recieve messages and do stuff with them
    if ( window.EventSource) {
      var source = new EventSource(url);

      var recieveMessage = function(event) {
        updateFailureCount = 0;
        var data = JSON.parse(event.data);
        if ( data ) {
          receiveMessage(data)
        }
      }

      source.addEventListener('message', recieveMessage, false);
      // Don't bother harassing server continually if we lost the connection
      source.addEventListener('error', function(event) {
        if (event.eventPhase == EventSource.CLOSED) {
          updateFailureCount += 1;
          if ( updateFailureCount >= MAX_UPDATE_FAILURES ) {
            source.close();
            maxFailures(updateFailureCount);
          }
        }
      }, false);

      return {
        pause: function(){
          source.removeEventListener('message', recieveMessage, false)
        }
      }

    } else {
      handleOldBrowsers('This browser does not support HTML5 server sent events. Add a shim for older browsers.')
    }
  }

  return listen

})
// Server-only code
define(function(require) {

  // Client: Maximum SSE update failures
  var MAX_UPDATE_FAILURES = 2;

  // Client: How many failures we've had so far
  var updateFailureCount = 0;

  // Listen for server sent events
  var setupUpdateListener = function(updateURLPath, receiveMessage, handleOldBrowsers){
    // Recieve messages and do stuff with them
    if ( window.EventSource) {
      var source = new EventSource(updateURLPath);
      source.addEventListener('message', function(event) {
        updateFailureCount = 0;
        var data = JSON.parse(event.data);
        if ( data ) {
          receiveMessage(data)
        }
      }, false);
      // Don't bother harassing server continually if we lost the connection
      source.addEventListener('error', function(event) {
        if (event.eventPhase == EventSource.CLOSED) {
          updateFailureCount += 1;
          if ( updateFailureCount >= MAX_UPDATE_FAILURES ) {
            $disconnectedModal.modal('show');
            source.close();
          }
        }
      }, false);
    } else {
      handleOldBrowsers('This browser does not support HTML5 server sent events. Please use Chrome, Firefox, Safari or IE11 instead.')
    }
  }

  return {
    setupUpdateListener: setupUpdateListener
  }

});

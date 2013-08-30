// Server code
define(function(require) {

  // Server: How long to tell browsers to wait if the server doesn't respond to our request for messages. In ms.
  var SSE_ERROR_RETRY = 5 * 1000;

  // Server: List of next responses for each client connected via SSE
  var pendingUpdateResponses = [];

  // Server: Message ID used for server sent events
  var messageID = 0;

  // Send some data on the response as an SSE stream (using JSON for the data)
  var respondWithStream = function(response, data, comment) {
    var responseContents = {
      id: messageID,
      retry: SSE_ERROR_RETRY,
      data: JSON.stringify(data)
    }
    var responseContentsFlattened = '';
    if ( comment ) {
      responseContentsFlattened += ':'+comment+'\n';
    }
    for ( var key in responseContents ) {
      responseContentsFlattened += key+': '+responseContents[key]+'\n';
    }
    response.write(responseContentsFlattened += '\n'); // Not end.
    messageID += 1;
  }

  // Send message to each connected client
  var sendUpdate = function(message){
    pendingUpdateResponses.forEach(function(response) {
      respondWithStream(response, message)
    });
  }

  // Recieve requests for SSE updates.
  var addUpdateHandler = function(keepAliveInterval, expressApp, URL){
    expressApp.get(URL, function(request, response) {
      // Send headers, and write data, but do not end the response - this is how SSE works
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });
      pendingUpdateResponses.push(response);
    });

    // SSE requires 'keep alive' responses every so often otherwise browsers will disconnect
    setInterval(function(){
      pendingUpdateResponses.forEach(function(response) {
        respondWithStream(response, null, 'keepalive')
      });
    }, keepAliveInterval)
  }

  return {
    addUpdateHandler: addUpdateHandler,
    respondWithStream: addUpdateHandler,
    sendUpdate: sendUpdate
  }

});

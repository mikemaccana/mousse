// Pamplemousse server

module.exports = function(sseErrorRetry, sseKeepAliveInterval){
  'use strict';

  var log = console.log.bind(console);

  // Pending update responses.
  // Key is customer. Value is an array of HTTP response objects.
  var channelResponses = {};

  // Message ID used for server sent events
  var channelMessageIDs = {};

  // Server: How long to tell browsers to wait if the server doesn't respond to our request for messages.
  var SSE_ERROR_RETRY = sseErrorRetry || 5 * 1000;

  // See setupKeepAlives for more info
  var SSE_KEEP_ALIVE_INTERVAL = sseKeepAliveInterval || 3 * 1000;

  // Helper used for both sendUpdate & setupKeepAlive
  // Simply creates messages in SSE text format
  // See http://www.html5rocks.com/en/tutorials/eventsource/basics/
  // for more info on how these responses are constructed
  var formatAndSendMessage = function(res, message, comment, messageID){
    var responseContents = {
      id: messageID,
      retry: SSE_ERROR_RETRY,
      data: JSON.stringify(message)
    };
    var responseContentsFlattened = '';
    if ( comment ) {
      responseContentsFlattened += ':'+comment+'\n';
    }
    for ( var key in responseContents ) {
      responseContentsFlattened += key+': '+responseContents[key]+'\n';
    }
    res.write(responseContentsFlattened += '\n'); // Not end.
  };

  // SSE requires 'keep alive' responses every so often otherwise browsers will disconnect
  var setupKeepAlives = function(){
    var sendKeepAlive = function(res, channelName){
      formatAndSendMessage(res, null, 'keepalive', channelMessageIDs[channelName].messageID)
        channelMessageIDs[channelName].messageID += 1;
    };
    setInterval(function(){
      for ( var channelName in channelResponses ) {
        channelResponses[channel].forEach(function(){
          sendKeepAlive(res, channelName)
        })
      }
    }, SSE_KEEP_ALIVE_INTERVAL)
  };

  // Add a client res to a channel, so the client will get all messages sent to that channel
  var subscribeToChannel = function(channel, res){
    // Send headers, and write data, but do not end the response - this is how SSE works
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    if ( channelResponses.hasOwnProperty(channel) ) {
      channelResponses[channel].push(res);
    } else {
      log('Web app has registered interest in updates for channel', channel)
      channelResponses[channel] = [res];
      channelMessageIDs[channel] = 0;
    }
  };

  // Send message to each subscribed client on the channel
  var sendUpdate = function(channelName, message){
    log('Sending update on channel', channelName);
    if ( channelResponses[channelName] ) {
      channelResponses[channelName].forEach(function(res) {
        formatAndSendMessage(res, message, null, channelMessageIDs[channelName].messageID)
        channelMessageIDs[channelName].messageID += 1;
      });
    } else {
      log('No waiting clients on channel', channelName)
    }
  };

  return {
    subscribeToChannel: subscribeToChannel,
    sendUpdate: sendUpdate
  };
}


// Pamplemousse server

module.exports = function(sseErrorRetry, sseKeepAliveInterval){
	'use strict';

	var log = console.log.bind(console);

	var channels = {}

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
			data: JSON.stringify(message),
			event: 'pamplemousse'
		};
		var responseContentsFlattened = '';
		if ( comment ) {
			responseContentsFlattened += ':'+comment+'\n';
		}
		for ( var key in responseContents ) {
			responseContentsFlattened += key+': '+responseContents[key]+'\n';
		}
		res.write(responseContentsFlattened += '\n');

		// Required when compression is enabled
		res.flushHeaders()

		// DO NOT end() the response - we'll send more messages in future.
	};

	// SSE requires 'keep alive' responses every so often otherwise browsers will disconnect
	var setupKeepAlives = function(){
		var sendKeepAlive = function(res, channel){
			formatAndSendMessage(res, null, 'keepalive', channels[channel].messageID)
			channels[channel].messageID += 1;
		};
		setInterval(function(){
			for ( var channel in channels ) {
				channels[channel].responses.forEach(function(response){
					sendKeepAlive(response, channel)
				})
			}
		}, SSE_KEEP_ALIVE_INTERVAL)
	};

	// Add a client res to a channel, so the client will get all messages sent to that channel
	var subscribeToChannel = function(channel, res){
		// Send headers, and write data, but do not end the response - this is how SSE works
		log('subscribeToChannel')
		// req.socket.setTimeout(Number.MAX_SAFE_INTEGER || Infinity);

		// Start SSE response
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});
		res.write('\n');

		if ( channels[channel] ) {
			log('adding response to channel', channel)
			channels[channel].responses.push(res);
		} else {
			log('created new channel', channel)
			channels[channel] = {
				// Pending update responses.
				responses: [res],
				messageID: 0
			}
		}
	};

	// Send message to each subscribed client on the channel
	var sendUpdate = function(channel, message){
		if ( channels[channel].responses ) {
			channels[channel].responses.forEach(function(res) {
				formatAndSendMessage(res, message, null, channels[channel].messageID)
				channels[channel].messageID += 1;
			});
		} else {
			log('No waiting clients on channel', channel)
		}
	};

	// Return a list of all channels with at least one subscriber
	var getActiveChannels = function(){
		var activeChannels = [];
		var channelNames = Object.keys(channels)
		channelNames.forEach(function(channel){
			if ( channels[channel].responses.length ) {
				activeChannels.push(channel)
			}
		})
		return activeChannels
	}

	var sendToActiveChannels = function(cb){
		var activeChannels = getActiveChannels()
		activeChannels.forEach(cb)
	}

	setupKeepAlives();

	return {
		subscribeToChannel: subscribeToChannel,
		sendUpdate: sendUpdate,
		getActiveChannels: getActiveChannels,
		sendToActiveChannels: sendToActiveChannels
	};
}


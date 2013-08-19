# Mousse

## Delicious SSE for the browser and Node/ExpressJS

It's supplied as a RequireJS module, and takes care of:

 * Encoding things in SSE format
 * Mime types
 * Updating message IDs
 * Timeouts
 * JSON in, JSON out

And other boring things. It's really quite small, but having a library should still save you some time.

### In Node/Express.JS

With 'app' as your Express 3 app, with a 3 second timeout, and setting up '/updates' as your SSE URL handler:

	var mousseServer = require('mousseServer.js'),

	mousseServer.addUpdateHandler(3 * 1000, app, '/updates');
	mousseServer.sendUpdate(someUpdateObject)

### In the browser

Assuming '/updates' (configured above) is the source for our SSE messages:

	var mousseClient = require('mousseClient');

	mousseClient.setupUpdateListener('/updates', function(message){
		// Do things with the recieved message
	});

### Thanks

Thanks to Eric Bidelman, whose awesome tutorial at http://www.html5rocks.com/en/tutorials/eventsource/basics/ formed the basis of my introduction to Server Sent events.

## Author

Mike MacCana (mike.maccana@gmail.com)

## License

MIT license
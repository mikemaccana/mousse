![Pamplemousse JS](http://pamplemoussejs.org/images/pamplemousse.png)

## Delicious SSE for the browser and Express 4

Features include:

 - Multiple channels!
 - Browserify code for the browser (`pamplemousse-browser`) and for ExpressJS (`pamplemousse`)
 - Takes care of keepalives!

## On the server

	var pamplemouse = require('pamplemousse')()

In your routes:

	router.get('/orders/:orderID/status', function(req, res) {
		var orderID = req.params.orderID
		pamplemouse.subscribeToChannel(orderID, res)
	});

When you'd like to send an update to connected clients, run sendToActiveChannels:

	sendToActiveChannels(function(activeChannel){
		pamplemousse.sendUpdate(activeChannel, 'you are subscribed to '+activeChannel)
	})


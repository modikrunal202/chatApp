let webSocketServer = require('websocket').server;
let http = require('http');

let history = []
let clients = []

function htmlEntities(str){
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

let server = http.createServer((req, res)=>{})
server.listen(1337, () => {
    console.log("Server is running:")
})

let wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on('request', (req) => {
    console.log((new Date()) + ' Connection from origin '
      + req.origin + '.');
    
    let connection = req.accept(null, req.origin);
    let index = clients.push(connection);
    let userName = false;
    let userColor = false;

    console.log((new Date()) + ' Connection accepted.');

    if(history.length > 0){
        connection.sendUTF(JSON.stringify({
            type: 'history',
            data: history
        }))
    }

    //User sent some message
    connection.on('message', (message) => {
        if(message.type == 'utf8'){ // accept if only text
            if(userName == false){
                // remember user name
                userName = htmlEntities(message.utf8Data);
                //Get random color and send it back to user
                userColor = colors.shift();
                connection.sendUTF(
                    JSON.stringify({ type:'color', data: userColor })
                )
                console.log((new Date()) + ' User is known as: ' + userName
                    + ' with ' + userColor + ' color.');
            }else{
                // log and broadcast the message
                console.log((new Date()) + ' Received Message from '
                    + userName + ': ' + message.utf8Data);

                // we want to keep history of all sent messages
                let obj = {
                    time : (new Date()).getTime(),
                    text : htmlEntities(message.utf8Data),
                    author : userName,
                    color : userColor
                }
                history.push(obj)
                history = history.slice(-100)

                //broadcast msg to all connected clients
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                clients[i].sendUTF(json);
                }
            }

        }
    })

    //User disconnected
    connection.on('close', (connection) => {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
          }
    })
})
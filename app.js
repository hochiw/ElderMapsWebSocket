

var WebSocketServer = require('ws').Server
var url = require('url');
var express = require("express")
var http = require("http")

var connections = {};
var app = express()
var port = process.env.PORT || 8080

var server = http.createServer(app)
server.listen(port)

console.log("Server running on %d",port);

var wsServer = new WebSocketServer({server:server})
console.log("Websocket initiated")

function heartbeat() {
    this.isAlive = true;
}

function noop() {};

wsServer.on('connection',function connection(ws,req) {
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    const queries = url.parse(req.url,true).query;
    switch(queries.type) {
        case "client":

            ws.type = "client";
            if (Object.keys(connections).length != 0) {

                for (var key in connections) {
                    if (connections[key].client == null) {
                        ws.id = key;
                        connections[key].client = ws;
                        var o = '{"type":"6","content":"' + ws.id + '"}';
                        console.log(ws.type + ws.id + " connected");
                        ws.send(o);
                        var connected = '{"type":"2","content": "Connected with Admin' + ws.id + '"}';
                        ws.send(connected);
                        break;

                    }
                }

            } else {
                console.log("HI");
                ws.send('{"type":"2","content":"No available admin at the moment, please try later"}');
            }
            break;
        case "admin":
            ws.type = "admin";
            ws.id = Math.floor(Math.random() * Math.floor(99999999));
            var o = '{"type":"6","content":"' + ws.id + '"}';
            ws.send(o.toString());
            connections[ws.id] = {"admin":ws,"client":null};
            var connected = '{"type":"2","content": "Connected with Client' + ws.id + '"}';
            ws.send(connected);
            break;
    }

    ws.on("message",function incoming(message) {
        if (ws.id != null) {
            for (var key in connections) {
                if (key == ws.id) {
                    switch (ws.type) {
                        case "admin":
                            if (connections[key].client != null) {
                                connections[key].client.send(message);
                            }
                            break;
                        case "client":
                            if (connections[key].admin != null) {
                                connections[key].admin.send(message);
                            }
                            break;
                    }
                }
            }
        }
    });

    ws.on("close", function() {
        switch(ws.type) {
            case "admin":
                delete connections[ws.id];
                break;
            case "client":
                if (connections[ws.id] != null) {
                    connections[ws.id].client = null;
                }
                break;
        }
        console.log("Disconnected");
    })
});


const interval = setInterval(function ping() {
    wsServer.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        ws.ping(noop);
    });
}, 5000);




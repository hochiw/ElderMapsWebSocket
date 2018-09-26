

var WebSocketServer = require('ws').Server
var url = require('url');
var express = require("express")
var http = require("http")

var connections = [];
var pairs = 0;
var app = express()
var port = process.env.PORT || 8080

var server = http.createServer(app)
server.listen(port)

console.log("Server running on %d",port);

var wsServer = new WebSocketServer({server:server})
console.log("Websocket initiated")

wsServer.on('connection',function connection(ws,req) {
    const queries = url.parse(req.url,true).query;
    switch(queries.type) {
        case "client":
            ws.type = "client";
            if (connections.length != 0) {
                for (var item in connections) {
                    if (connections[item].client == null) {
                        ws.id = connections[item].id;
                        connections[item].client = ws;
                        ws.send("Connected with admin: No." + connections[item].id);
                        break;

                    }
                }
                break;
            } else {
                ws.send("No available admin at the moment, please try later");
            }

        case "admin":
            ws.type = "admin";
            ws.id = pairs;
            ws.send("Hello Admin No. " + ws.id);
            connections.push({id: pairs++,"admin":ws,"client":null});
            break;
    }

    ws.on("message",function incoming(message) {
        if (ws.id != null) {
            for (var item in connections) {
                if (connections[item].id == ws.id) {
                    switch (ws.type) {
                        case "admin":
                            connections[item].client.send(message);
                            break;
                        case "client":
                            connections[item].admin.send(message);
                            break;
                    }
                }
            }
        }
    });

    ws.on("close", function() {
        switch(ws.type) {
            case "admin":
                connections.splice(ws.id,1);
                break;
            case "client":
                if (connections[ws.id] != null) {
                    connections[ws.id].client = null;
                }
                break;
        }
        console.log("Disconnected");
        console.log(connections);
    })
});


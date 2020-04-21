/*
Code partially adapted from the Socket.IO documentation's tutorial.
https://socket.io/get-started/chat
Author: James Bennett 
*/

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
exports.io = io;
const PORT = process.env.PORT
const serviceAccount = require("./config/syncsport_firebase_keys.json")
const dbAdmin = require('firebase-admin');
dbAdmin.initializeApp({
    credential: dbAdmin.credential.cert(serviceAccount),
    databaseURL: "https://syncsport-4cc01.firebaseio.com"
});
const db = dbAdmin.database();
exports.db = db;
require("./namespaces/chatEvents");
require("./namespaces/roomEvents");

/*
 Root route. Only used for early web app testing.
*/
app.get('/', function(req, res) {
    res.render('index.ejs');
});

/*
    Express route for creating a new room.
    It takes the room name as an argument, then stores it in DB.
*/
app.post('/rooms/:roomName', function(req, res){
    console.log("room name = " + req.params.roomName)
    db.ref("/rooms/" + req.params.roomName).set({
        member_count: 0,
        message_count: 0,
        public: true,
        last_used: Date.now()
    });
    res.send(req.params)
});

const server = http.listen(PORT, function() {
    console.log('listening on *:'+PORT);
});
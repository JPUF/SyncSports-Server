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

app.get('/', function(req, res) {
    res.render('index.ejs');
});

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
/*
app.get('/rooms', function(req, res){
    var roomArray;
    var ref = db.ref("/rooms");
    
    ref.once("value", function(snapshot) {
        roomArray = snapshot.val();
        var filteredRooms = removeExpiredRooms(roomArray);
        console.log("\n\nAll rooms: " + filteredRooms);
        res.send(filteredRooms)
    })
});
*/

/*
    Iterates through an array of all rooms.
    Removes any room that hasn't seen use in 3+ hours.
*/
function removeExpiredRooms(roomArray) {    
    for( let room in roomArray) {
        console.log("EXPIRE CHECK: " + room + " : " + roomArray[room].last_used)
        let isEmpty = roomArray[room].member_count == 0 ? true : false;
        let timeSinceLastUsed = Date.now() - roomArray[room].last_used
        let threeHours = 1000 * 60 * 60 * 3;

        if(isEmpty && timeSinceLastUsed >= threeHours) {
            console.log("expired: " + room)
            //Delete room
            db.ref("/rooms/"+room).remove()
            delete roomArray[room];
        }
    }
    return roomArray;
}

const server = http.listen(PORT, function() {
    console.log('listening on *:'+PORT);
});
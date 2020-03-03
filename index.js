/*
Code adapted from the Socket.IO documentation's tutorial.
https://socket.io/get-started/chat
*/

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT

const serviceAccount = require("./config/syncsport_firebase_keys.json")
const dbAdmin = require('firebase-admin');
dbAdmin.initializeApp({
    credential: dbAdmin.credential.cert(serviceAccount),
    databaseURL: "https://syncsport-4cc01.firebaseio.com"
});
const db = dbAdmin.database();

app.get('/', function(req, res) {
    res.render('index.ejs');
});

app.post('/rooms/:roomName', function(req, res){
    console.log("room name = " + req.params.roomName)
    db.ref("/rooms/" + req.params.roomName).set({
        member_count: 0,
        public: true,
        last_used: Date.now()
    });
    res.send(req.params)
});

app.get('/rooms', function(req, res){
    removeExpiredRooms();
    var roomArray;
    var ref = db.ref("/rooms");
    ref.once("value", function(snapshot) {
        roomArray = snapshot.val();
        console.log("\n\nAll rooms: " + roomArray);
        res.send(roomArray)
    })
});

function removeExpiredRooms() {
    var ref = db.ref("/rooms");
    var roomArray;
    ref.once("value", function(snapshot) {
        roomArray = snapshot.val();
        for( let room in roomArray) {
            console.log("EXPIRE CHECK: " + room + " : " + roomArray[room].last_used)
            if(roomArray[room].member_count == 0) {//this test doesn't work. may need to read from DB. 
                console.log("member count 0: " + room)
            }
        }
    })
    //iterate through rooms. Delete rooms with 0 members and long time since last use. 
}

function updateRoomCount(roomName) {
    //Update room member count
    const roomRef = db.ref("/rooms");
    var memberCount;
    if(io.sockets.adapter.rooms[roomName]) {
        memberCount = io.sockets.adapter.rooms[roomName].length
    } else {
        memberCount = 0;
        roomRef.child(roomName).update({
            'last_used': Date.now()
        });
    }
    roomRef.child(roomName).update({
        'member_count': memberCount
    });
}

io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        console.log("user joined: " + username)
        socket.on("room", function(room){
            socket.username = username;
            socket.room = room
            io.emit('is_online', '<i>' + socket.username + ' joined ' + room + '</i>');
            socket.join(room)
            console.log("joining room: " + room)
            updateRoomCount(room)
        });        
    });

    socket.on('disconnect', function(username) {
        console.log("disconnect called, from room: " + socket.room)
        io.emit('is_online', '<i>' + socket.username + ' has left '+ socket.room +'</i>');
        updateRoomCount(socket.room);
    })

    socket.on('chat_message', function(object) {
        io.sockets.in(socket.room).emit('chat_message', {
            'username' : socket.username,
            'color' : object.color,
            'message' : object.message,
            'user_time' : object.user_time
        });
        db.ref("/rooms/" + socket.room).update({
            'last_used': Date.now()
        })
    });

});

const server = http.listen(PORT, function() {
    console.log('listening on *:'+PORT);
});
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
        public: true
    });
    res.send(req.params)
});

app.get('/rooms', function(req, res){
    var roomArray;
    var ref = db.ref("/rooms");
    ref.once("value", function(snapshot) {
        roomArray = snapshot.val();
        console.log("\n\nAll rooms: " + roomArray);
        res.send(roomArray)
    })
});

function updateRoomCount(roomName) {
    //Update room member count
    const roomRef = db.ref("/rooms");
    roomRef.child(roomName).update({
        'member_count': io.sockets.adapter.rooms[roomName].length
    })
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
        io.emit('is_online', '<i>' + socket.username + ' has left '+ socket.room +'</i>');
        //maybe socket.leave(socket.room)?
        updateRoomCount(socket.room);
    })

    socket.on('chat_message', function(object) {
        io.sockets.in(socket.room).emit('chat_message', {
            'username' : socket.username,
            'color' : object.color,
            'message' : object.message,
            'user_time' : object.user_time
        });
    });

});

const server = http.listen(PORT, function() {
    console.log('listening on *:'+PORT);
});
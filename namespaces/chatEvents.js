const { io, db } = require("../index");
const chatNamespace = io.of('/chat');


chatNamespace.on('connection', function (socket) {
    socket.on('username', function (username) {
        console.log("user joined: " + username);
        socket.on("room", function (room) {
            socket.username = username;
            socket.room = room;
            io.emit('is_online', '<i>' + socket.username + ' joined ' + room + '</i>');
            socket.join(room);
            console.log("joining room: " + room);
            updateRoomCount(room);
        });
    });
    socket.on('disconnect', function (username) {
        console.log("disconnect called, from room: " + socket.room);
        io.emit('is_online', '<i>' + socket.username + ' has left ' + socket.room + '</i>');
        updateRoomCount(socket.room);
    });
    socket.on('chat_message', function (object) {
        const chatObject = {
            'username': socket.username,
            'color': object.color,
            'message': object.message,
            'user_time': object.user_time
        };
        chatNamespace.in(socket.room).emit('chat_message', chatObject);
        db.ref("/rooms/" + socket.room).update({
            'last_used': Date.now()
        });
        console.log("Message to save: " + chatObject.message)
        logMessage(socket.room, chatObject)
    });
});

function updateRoomCount(roomName) {
    //Update room member count
    const roomRef = db.ref("/rooms");
    var memberCount;
    if (io.sockets.adapter.rooms[roomName]) {
        memberCount = io.sockets.adapter.rooms[roomName].length;
    }
    else {
        memberCount = 0;
        roomRef.child(roomName).update({
            'last_used': Date.now()
        });
    }
    console.log("updating member count of room: "+roomName+" to #"+memberCount)
    roomRef.child(roomName).update({
        'member_count': memberCount
    });
};

function logMessage(room, messageObject) {
    const messageRef = db.ref("/messages/" + room + "/"+messageObject.message);
    messageRef.set(messageObject);
};
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
        incrementMessageCount(socket.room);
        getRoomObject(socket.room).then(function(snapshot){
            const snapVal = snapshot.val()
            console.log("snapshot value: " + snapVal.message_count)
            const chatObject = {
                'id': snapVal.message_count,
                'parent_id' : object.parent_id,
                'username': object.username,
                'color': object.color,
                'message': object.message,
                'user_time': object.user_time
            };
            emitMessage(chatObject, socket.room)
            console.log("Message to save: " + chatObject.message)
            logMessage(socket.room, chatObject)  
        }) 
    });
});

/**
 * Broadcast a message to all relevant users.
 * @param {*} object The message object to be sent.
 * @param {*} room The name of the chatroom to broadcast to.
 */
function emitMessage(object, room) {
    chatNamespace.in(room).emit('chat_message', object);
    db.ref("/rooms/" + room).update({
        'last_used': Date.now()
    });
}

/**
 * Update the number of chatroom members.
 * 
 * If there a no members, then set the last_used field to the current time.
 */
function updateRoomCount(roomName) {
    //Update room member count
    const roomRef = db.ref("/rooms");
    var memberCount;
    if (chatNamespace.adapter.rooms[roomName]) {
        memberCount = chatNamespace.adapter.rooms[roomName].length;
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

/**
 * Read the stored info on a given room.
 */
function getRoomObject(room) {
    const roomRef = db.ref("/rooms/" + room);
    return roomRef.once("value");        
}

/**
 * Update the message count. Each room has a field in the DB that describes the numbers of messages sent.
 */
function incrementMessageCount(room) {
    console.log("Incrementing count in room: "+room)
    const roomRef = db.ref("/rooms/"+room);
    roomRef.once("value", function(snapshot){
        const roomObject = snapshot.val();
        var number = roomObject.message_count
        if(number == undefined) number = 0;
        console.log("number = "+number)
        roomRef.update({
            'message_count' : number + 1
        })
    })
}

/**
 * Store a copy of the given message into the database.
 */
function logMessage(room, messageObject) {
    const messageRef = db.ref("/messages/" + room + "/"+messageObject.id);
    messageRef.set(messageObject);
};
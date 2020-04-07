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
        var id;
        if(object.id == undefined) {
            getRoomObject(socket.room).then(function(snapshot){
                const snapVal = snapshot.val()
                console.log("snapshot value: " + snapVal.message_count)
            })
            console.log("out of body, Object ID is: " + id)
        }
        else id = object.id;
        console.log("after check, Object ID is: " + id)

        const chatObject = {
            'id': 2,
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

function getRoomObject(room) {
    const roomRef = db.ref("/rooms/" + room);
    return roomRef.once("value");        
}

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
function logMessage(room, messageObject) {
    const messageRef = db.ref("/messages/" + room + "/"+messageObject.message);
    messageRef.set(messageObject);
};
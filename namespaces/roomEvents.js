const { io, db } = require("../index");
const roomNamespace = io.of('/rooms');


roomNamespace.on('connection', function (socket) {
    console.log("connection made to room namespace.");

    socket.on("room_request", function() {
        console.log("Received room request");
        //get all rooms

        var roomArray;
        db.ref("/rooms").on("value", function(snapshot) {
            roomArray = snapshot.val();
            var filteredRooms = removeExpiredRooms(roomArray);
            console.log("namespace rooms: " + filteredRooms);
            roomNamespace.emit("room_response", filteredRooms);
        })
    });

    socket.on('disconnect', function () {
        console.log("A disconnect from room namespace.")
    });
    
});

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
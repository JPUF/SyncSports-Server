const { io, db } = require("../index");
const roomNamespace = io.of('/rooms');


roomNamespace.on('connection', function (socket) {
    console.log("connection made to room namespace.");

    socket.on("room_request", function() {
        console.log("Received room request");
        //get all rooms
        const rooms = "Dummy Room object";
        roomNamespace.emit("room_response", rooms)
    });

    socket.on('disconnect', function () {
        console.log("A disconnect from room namespace.")
    });
    
});
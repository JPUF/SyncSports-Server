const { io, db } = require("../index");
const roomNamespace = io.of('/rooms');


roomNamespace.on('connection', function (socket) {
    console.log("connection made to room namespace.");
    socket.on('disconnect', function (username) {
        console.log("A disconnect from room namespace.")
    });
    
});
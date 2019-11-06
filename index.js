/*
Code adapted from the Socket.IO documentation's tutorial.
https://socket.io/get-started/chat
*/

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.render('index.ejs');
});


io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
        io.emit('is_online', '<i>' + socket.username + ' connected..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '<i>' + socket.username + ' disconnected..</i>');
    })

    socket.on('chat_message', function(object) {
        io.emit('chat_message', {
            'username' : socket.username,
            'color' : object.color,
            'message' : object.message,
            'user_time' : object.user_time
        });
    });

});

const server = http.listen(4000, function() {
    console.log('listening on *:4000');
});
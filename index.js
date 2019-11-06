/*
Code adapted from the Socket.IO documentation's tutorial.
https://socket.io/get-started/chat
*/

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 4000

app.get('/', function(req, res) {
    res.render('index.ejs');
});


io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
<<<<<<< HEAD
        io.emit('is_online', '<i>' + socket.username + ' connected..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '<i>' + socket.username + ' disconnected..</i>');
=======
        io.emit('is_online', '🔵 <i>' + socket.username + ' joined the chat...</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat...</i>');
>>>>>>> efe47434f14eb8915c1307be8b33e709502c807b
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

const server = http.listen(PORT, function() {
    console.log('listening on *:'+PORT);
});
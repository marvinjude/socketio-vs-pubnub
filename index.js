var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var connections = [];

app.get('/socketio', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
app.get('/pubnub', function(req, res) {
  res.sendFile(__dirname + '/public/index2.html');
});

io.on('connection', function(socket) {
  console.log('a user connected', Date.now().toLocaleString());
  connections.push(socket);
  console.log(connections.length);

  socket.on('chat message', function(message) {
    io.sockets.emit('new message', message);
  });

  socket.on('disconnect', function() {
    console.log('user disconnected', Date.now().toLocaleString());
    connections.splice(connections.indexOf(socket), 1);

    console.log(connections.length);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

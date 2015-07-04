// require express and path
var express = require("express");
var path = require("path");
// create the express app
var app = express();
// static content 
app.use(express.static(__dirname, "./static"));
// setting up ejs and our views folder
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
// root route to render the index.ejs view
app.get('/', function (req, res) {
 res.render("index");
})
// tell the express app to listen on port 8000
var server = app.listen(8000, function() {
 console.log("listening on port 8000");
})

var io = require('socket.io').listen(server);

var user_list = {}
io.sockets.on('connection', function (socket){
  user_list[socket.id] = {};
  console.log(socket.id);
  var string;

  socket.on('pick_name',function (name){
    user_list[socket.id].name = name;
    console.log(name);
    var users = [];
    for (user in user_list){
      if (user_list[user].room == user_list[socket.id].room){
        users.push(user_list[user].name);
      }
    }
    string = user_list[socket.id].name + " has connected"
    io.to(user_list[user].room).emit("current_user_joined",{users:users, message:{}});
    if (user_list[socket.id].name != undefined)
    socket.to(user_list[user].room).broadcast.emit('other_user_joined', {message:string});


  });

  socket.on('pick_room',function (room){
    leavestring = user_list[socket.id].name + " has disconnected";
    if (user_list[socket.id].name != undefined){
      socket.to(user_list[socket.id].room).broadcast.emit('other_user_joined', {message:leavestring});
    }
    var users_previous = [];
    var previous_room = user_list[socket.id].room;
    
    socket.leave(user_list[socket.id].room);
    
    user_list[socket.id].room = room;
    for (user in user_list){
      if (user_list[user].room == previous_room){
        users_previous.push(user_list[user].name);
      }
    }
    socket.to(previous_room).broadcast.emit('user_left',{users:users_previous});
    socket.join(room);
    console.log(user_list[socket.id].room);

    var users = [];
    for (user in user_list){
      if (user_list[user].room == room){
        users.push(user_list[user].name);
      }
    }
    string = user_list[socket.id].name + " has connected"
    io.to(room).emit("current_user_joined",{users:users, message:{}});
    if (user_list[socket.id].name != undefined)
    socket.to(room).broadcast.emit('other_user_joined', {message:string});
  })

  socket.on("disconnect", function(data){
    console.log("disconnected: " + socket.id);
    console.log(user_list);
    var users = [];
    var string;
    var name = user_list[socket.id].name;
    var room = user_list[socket.id].room;
    
    string = user_list[socket.id].name + " has disconnected"
    
    delete user_list[socket.id];
    for (user in user_list){
      users.push(user_list[user].name);
    }
    if(name != undefined){
      console.log(name);  
    io.to(room).emit("user_left", {users:users,message:string,room:room});
    }
  });

  socket.on("send_message",function(data){
    var string = "";
    string += user_list[socket.id].name + ": " + data.message;
    if(user_list[socket.id].name != undefined)
    io.to(user_list[socket.id].room).emit("sent_message", {message:string})
  });

})
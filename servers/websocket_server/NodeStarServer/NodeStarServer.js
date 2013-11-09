
var BoardServer = require('./BoardServer');
var ChatServer = require('./ChatServer');
var UserServer = require('./UserServer');

module.exports = NodeStarServer;


function NodeStarServer(serverPeerId){

  /*** PeerJS Data ***/
  var peerSockets = {};

  /** Data **/
  var connBuffer = {};
  var eventHandlers = {}; //  Open, Close, Error, ClientEnter, ClientLeave
  var requestHandlers = {};
  var debug = false;
  var messageLimit = 50000;


  /*** Public methods ***/
  
  this.debug = function(d){
    debug = d;
  }

  // Adds a handler to a particular server event
  this.onServerEvent = function(event, handler){
    if (eventHandlers[event] == null)
      eventHandlers[event] = [];
    eventHandlers[event].push(handler);
  }

  //  Removes a handler for a particular server event
  this.removeOnServerEvent = function(event, handler){
    if (eventHandlers[event] != null){
      var index = eventHandlers[event].indexOf(handler);
      if (index > -1) 
        eventHandlers[event].splice(index, 1);
    }
  }

  // Adds a handler to a particular request
  this.onRequest = function(type, handler){
    if (requestHandlers[type] == null)
      requestHandlers[type] = [];
    requestHandlers[type].push(handler);
  }

  //  Removes a handler for a particular request
  this.removeOnRequest = function(type, handler){
    if (requestHandlers[type] != null){
      var index = requestHandlers[type].indexOf(handler);
      if (index > -1) 
        requestHandlers[type].splice(index, 1);
    }
  } 

  //  Sends a message to a particular client
  this.send = function(peerId, message){
    send(peerId, "message:"+JSON.stringify(message));
  }

  //  Broadcast a message to all connected clients
  this.broadcast = function(message){
    broadcast("message:"+JSON.stringify(message));
  }
 
  //  Returns the PeerJS ID of server
  this.getServerNodeId = function(){
    return serverPeerId;
  }



  /*** PeerJS methods ***/

  //  Send a message to a peer
  function send(peerId, message){
      clientConnectionSend(peerId, message);
  }

  //  Broadcast a message to all connected clients
  function broadcast(message){
      for (var peerId in peerSockets)
        clientConnectionSend(peerId, message);
  }

  //  Function to segment messages that are too long
  var clientConnectionSend = function(peerId, message){
      if (message.length < messageLimit){
          peerSockets[peerId].emit('data', message);
      } else {
          //  First segment
          peerSockets[peerId].emit('data', "segmentstart:"+message.substring(0, messageLimit));
          message = message.substring(messageLimit);

          while (message.length > messageLimit){
              peerSockets[peerId].emit('data', "segment:"+message.substring(0, messageLimit));
              message = message.substring(messageLimit); 
          }

          //  Last segment
          peerSockets[peerId].emit('data', "segmentend:"+message);
      }
  }



  //  Socket Connection
  this.socketOpenHandler = function(socket){
      if (debug)
        console.log("New peer: "+socket.peerId);

      //  Store connection      
      var id = socket.peerId;

      peerSockets[id] = socket;

      //  Open Handler
      connOpenHandler(id);
  
      /*** Connection Handlers ***/
      socket.on('data', function(data){connDataHandler(id, data);});
      socket.on('disconnect', function(){connCloseHandler(id);});
  }


  /** Generic Server Methods**/

  //  Connection Open
  var connOpenHandler = function(id){
       //  Broadcast to all users new user has joined
      var message = new Message(id);
      message.type = "ClientEnter";
      broadcast("event:"+JSON.stringify(message));

      //  Send user list with ids to new connection
      var message = new Message(Object.keys(peerSockets));
      message.type = "ClientList";
      send(id, "event:"+JSON.stringify(message));

      //  ClientEnter handler
      if (eventHandlers['ClientEnter'] != null)
          for (var i in eventHandlers['ClientEnter'])
              eventHandlers['ClientEnter'][i](id);
  }

  //  Connection Data
  var connDataHandler = function(id, data){
      if (debug)
        console.log(data);

      var datatype = data.substring(0,data.indexOf(":"));
      var messageString = data.substring(data.indexOf(":")+1, data.length);

      //  Segmented message
      if (datatype == 'segment'){
          connBuffer[id] += messageString;
          return;
      } else if (datatype == 'segmentstart'){
          connBuffer[id] = messageString;
          return;
      } else if (datatype == 'segmentend'){
          connBuffer[id] += messageString;
          connDataHandler(id, connBuffer[id]);
          delete connBuffer[id];
          return;
      }

      //  Normal message
      var message = JSON.parse(messageString);
      message.peerId = id;
      message.timestamp = new Date().getTime();

      if (datatype == 'broadcast'){
        broadcast("message:"+messageString);
      } else if (datatype == 'request'){
        var type = message['type'];
        if (requestHandlers[type] != null)
          for (var i in requestHandlers[type])
            requestHandlers[type][i](message);
      } 
  }

  //  Connection Close
  var connCloseHandler = function(id){
    if (peerSockets[id] == null)
        return;

      if (eventHandlers['ClientLeave'] != null)
        for (var i in eventHandlers['ClientLeave'])
          eventHandlers['ClientLeave'][i](id);

      var message = new Message(id);
      message.type = "ClientLeave";
      broadcast("event:"+JSON.stringify(message));
  }

  /*** Messages structure ***/
  function Message(data){
    this.type = "";
    this.data = data;
    this.timestamp = new Date().getTime();
  }



  //  Setup
  var chatServer = new ChatServer(this);
  var boardServer = new BoardServer(this);
  var userServer = new UserServer(this);

  //  PeerJS Open
  function peerjsOpenHandler(){
    if (debug)
      console.log("Server started, id: "+serverPeerId);

    //  Reset peers
    peerConnections = {};
    connBuffer = {};
    
    if (eventHandlers['Open'] != null)
      for (var i in eventHandlers['Open'])
        eventHandlers['Open'][i](serverPeerId);
  }
  peerjsOpenHandler();

}
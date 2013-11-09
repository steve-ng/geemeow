function RTCStarServer(){

  /*** PeerJS Data ***/
  var serverPeer;
  var peerConnections;
  this.key = "";
  this.host = "0.peerjs.com";
  this.port = 9000;
  this.secure = false;

  /** Data **/
  var connBuffer;
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

  //  Starts the server
  this.start = function(){
    //  Create peer
    var options = {key: this.key, host: this.host, port: this.port, secure: this.secure};
    if (this.key.length == 0)
      delete options.key;
    serverPeer = new Peer(options);

    //  Event handlers
    serverPeer.on('open', peerjsOpenHandler);
    serverPeer.on('close', peerjsCloseHandler);
    serverPeer.on('error', peerjsErrorHandler);
    serverPeer.on('connection', peerjsConnectionHandler);
  }

  //  Stops the server
  this.stop = function(){
    serverPeer.destroy();
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
  this.getServerPeerId = function(){
    return serverPeer.id;
  }



  /*** PeerJS methods ***/

  //  Send a message to a peer
  function send(peerId, message){
      clientConnectionSend(peerId, message);
  }

  //  Broadcast a message to all connected clients
  function broadcast(message){
      for (var peerId in peerConnections)
        clientConnectionSend(peerId, message);
  }

  //  Function to segment messages that are too long
  var clientConnectionSend = function(peerId, message){
      if (message.length < messageLimit){
          peerConnections[peerId].send(message);
      } else {
          //  First segment
          peerConnections[peerId].send("segmentstart:"+message.substring(0, messageLimit));
          message = message.substring(messageLimit);

          while (message.length > messageLimit){
             console.log(message.substring(0, messageLimit).length);
              peerConnections[peerId].send("segment:"+message.substring(0, messageLimit));
              message = message.substring(messageLimit); 
          }

          //  Last segment
          peerConnections[peerId].send("segmentend:"+message);
      }
  }

  //  PeerJS Open
  function peerjsOpenHandler(){
    if (debug)
      console.log("Server started, id: "+serverPeer.id);

    //  Reset peers
    peerConnections = {};
    connBuffer = {};
    
    if (eventHandlers['Open'] != null)
      for (var i in eventHandlers['Open'])
        eventHandlers['Open'][i](serverPeer.id);
  }


  //  PeerJS Close
  function peerjsCloseHandler(){
    if (eventHandlers['Close'] != null)
      for (var i in eventHandlers['Close'])
        eventHandlers['Close'][i]();
  }

  //  PeerJS Error
  function peerjsErrorHandler(err){
    if (eventHandlers['Error'] != null)
      for (var i in eventHandlers['Error'])
        eventHandlers['Error'][i](err);
  }

  //  PeerJS Connection
  function peerjsConnectionHandler(conn){
    conn.on('open', function(){
      if (debug)
        console.log("New peer: "+conn.peer);

      var id = conn.peer;

      //  Store connection
      peerConnections[id] = conn;

      //  Open Handler
      connOpenHandler(id);
  
      /*** Connection Handlers ***/
      conn.on('data', function(data){connDataHandler(id, data);});
      conn.on('close', function(){connCloseHandler(id);});
      conn.on('error', function(err){
        delete peerConnections[id];
        connCloseHandler(id);
      });
    });
  }


  /** Generic Server Methods**/

  //  Connection Open
  var connOpenHandler = function(id){
       //  Broadcast to all users new user has joined
      var message = new Message(id);
      message.type = "ClientEnter";
      broadcast("event:"+JSON.stringify(message));

      //  Send user list with ids to new connection
      var message = new Message(Object.keys(peerConnections));
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
    if (peerConnections[id] == null)
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
}

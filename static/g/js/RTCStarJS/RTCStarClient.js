
function RTCStarClient(){

  /*** Data ***/
  var clientPeer;
  var serverPeerId;
  var serverConnection, serverBuffer;
  var eventHandlers = {}; //  Open, Close, Error, ClientEnter, ClientLeave, ClientList, Call
  var messageHandlers = {};
  var debug = false;
  var messageLimit = 50000;
  this.key = "";
  this.host = "0.peerjs.com";
  this.port = 9000;
  this.secure = false;

  /*** Public methods ***/
  this.debug = function(d){
    debug = d;
  }

  //  Adds a handler to a particular client event
  this.onClientEvent = function(event, handler){
    if (eventHandlers[event] == undefined)
      eventHandlers[event] = [];
    eventHandlers[event].push(handler);
  }

  //  Removes a handler for a particular server event
  this.removeOnClientEvent = function(event, handler){
    if (eventHandlers[event] != undefined){
      var index = eventHandlers[event].indexOf(handler);
      if (index > -1) 
        eventHandlers[event].splice(index, 1);
    }
  }

  // Adds a handler to a particular message. Message is a json object.
  this.onMessage = function(type, handler){
    if (messageHandlers[type] == undefined)
      messageHandlers[type] = [];
    messageHandlers[type].push(handler);
  }

  //  Removes a handler for a particular message
  this.removeOnMessage = function(type, handler){
    if (messageHandlers[type] != undefined){
      var index = messageHandlers[type].indexOf(handler);
      if (index > -1) 
        messageHandlers[type].splice(index, 1);
    }
  } 

  //  Sends a request to server, message.type contains the type. Message is a json object.
  this.request = function(message){
    serverConnectionSend("request:"+JSON.stringify(message));
  }

  //  Ask the server to broadcast a message. Message is a json object.
  this.broadcast = function(message){
    serverConnectionSend("broadcast:"+JSON.stringify(message));
  }



  /***  PeerJS methods ***/

  //  Function to segment messages that are too long
  var serverConnectionSend = function(message){
      var messageSize = message.length;
      if (message.length < messageLimit){
          serverConnection.send(message);
      } else {
          //  First segment
          serverConnection.send("segmentstart:"+message.substring(0, messageLimit));
          message = message.substring(messageLimit);

          while (message.length > messageLimit){
            serverConnection.send("segment:"+(messageSize-message.length)+","+messageSize+","+message.substring(0, messageLimit));
            message = message.substring(messageLimit); 
          }

          //  Last segment
          serverConnection.send("segmentend:"+message);
      }
  }

  //  To start the client
  this.start = function(serverId){
    //  Create peer
    var options = {host: this.host, port: this.port};
    if (this.key && this.key.length > 0)
      options.key = this.key;
    if (this.secure)
      options.secure = this.secure;
    
    clientPeer = new Peer(options);
    serverPeerId = serverId;

    //  Event handlers
    clientPeer.on('open', peerjsOpenHandler);
    clientPeer.on('close', peerjsCloseHandler);
    clientPeer.on('error', peerjsErrorHandler);
    clientPeer.on('call', peerjsCallHandler);
  }

  //  To stop the client
  this.stop = function(){
    clientPeer.destroy();
  }

  //  Returns the PeerJS ID of client
  this.getClientPeerId = function(){
    return clientPeer.id;
  }

  //  PeerJS call function
  this.call = function(peerId, stream){
    var callSent = clientPeer.call(peerId, stream);
    return callSent;
  }


   /*** PeerJS Event Handlers ***/

  //  PeerJS Open
  function peerjsOpenHandler(){
    if (debug)
      console.log("Client started, id: "+clientPeer.id);

    //  Connect to server
    serverConnection = clientPeer.connect(serverPeerId);
    serverConnection.on('open', openHandler);
    serverConnection.on('data', dataHandler);
    serverConnection.on('close', closeHandler);
    serverConnection.on('error', errorHandler);
  }

  //  PeerJS Close
  function peerjsCloseHandler(){
    if (eventHandlers['Close'] != undefined)
      for (var i in eventHandlers['Close'])
        eventHandlers['Close'][i]();
  }

  //  PeerJS Error
  function peerjsErrorHandler(err){
    if (eventHandlers['Error'] != undefined)
      for (var i in eventHandlers['Error'])
        eventHandlers['Error'][i](err);
  }

  //  Client Call
  function peerjsCallHandler(callConn){
    if (eventHandlers['Call'] != undefined)
      for (var i in eventHandlers['Call'])
        eventHandlers['Call'][i](callConn);
  }




  /*** Client Event Handlers ***/

  //  Client Open
  function openHandler(){
    if (debug)
      console.log("Client connected, id: "+clientPeer.id);
    
    if (eventHandlers['Open'] != undefined)
      for (var i in eventHandlers['Open'])
        eventHandlers['Open'][i](clientPeer.id, serverPeerId);
  }

    //  Client Close
  function closeHandler(){
    if (eventHandlers['Close'] != undefined)
      for (var i in eventHandlers['Close'])
        eventHandlers['Close'][i](serverPeerId);
  }

    //  Client Error
  function errorHandler(){
    if (eventHandlers['Error'] != undefined)
      for (var i in eventHandlers['Error'])
        eventHandlers['Error'][i](serverPeerId);
  }

  //  Client Data
  function dataHandler(data){
    if (debug)
      console.log(data);

    var datatype = data.substring(0,data.indexOf(":"));
    var messageString = data.substring(data.indexOf(":")+1, data.length);
    
    //  Segmented message
    if (datatype == 'segment'){
        serverBuffer += messageString;
        return;
    } else if (datatype == 'segmentstart'){
        serverBuffer = messageString;
        return;
    } else if (datatype == 'segmentend'){
        serverBuffer += messageString;
        dataHandler(serverBuffer);
        serverBuffer = "";
        return;
    }

    //  Normal message
    var message = JSON.parse(messageString);
    if (message['type'] == undefined)
      return;

    //  Events
    if (datatype == "event"){
      if (eventHandlers[message.type] != undefined)
        for (var i in eventHandlers[message.type])
          eventHandlers[message.type][i](message);

    //  Messages
    } else if (datatype == "message"){
      if (messageHandlers[message.type] != undefined)
        for (var i in messageHandlers[message.type])
          messageHandlers[message.type][i](message);
    }
  } 


}



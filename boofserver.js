const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// Client class to store client details and WebSocket object
class Client {
  constructor(type, id, ipaddr, ws) {
    this.type = type;//MUST BE SPECIFIED @ instantiation
    this.id = id;//generated server side
    this.ipaddr = ipaddr;//assigned @ instantiation
    this.ws = ws;//WebSocket instance created when client connects to server
	this.name = `DEFAULTNAME_' + ${type}`;//assigns a default name based on the client's specified type
  }

//essentaily a toString() that logs to server console
  logClient() {
    console.log(`Client Info: ID=${this.id}, Type=${this.type}, IP=${this.ipaddr}, Name=${this.name}`);
  }
}

console.log('Starting server');

const app = express();//express http server, base layer for WebSocket Server
const port = 3000;//active port of Server

app.use(express.static('public'));//allow the server to use files from the public directory
app.get('/', (req, res) => {//set root directory to serve index.html
  res.sendFile(__dirname + '/index.html');
});

const server = app.listen(port, () => {//initiate express server on specifed port
  console.log(`Server is listening on http://localhost:${port}`);
  logServerIP();
});

const wss = new WebSocket.Server({ server });//create WebSocket server, wraps aroung express Server

let clients = new Map();//map to store client instances as they connect to the Server
let user = null; // Special variable for the interface client

const validClientTypes = ['dummy', 'rover', 'pad'];//client types that are allowed to connect to the Server

wss.on('connection', (ws, req) => {//when there is a new connection to the WebSocket server
  console.log(`Client trying to connect: ${req.socket.remoteAddress}`);

  ws.on('message', (message) => {//when a message is received from a Client
    const data = JSON.parse(message);// create json object based on the parameter of 'message' callback
    console.log(`Message received from client: ${message}`);

    if (data.type === 'verification') {//check if the message type is 'verification'
      handleVerification(ws, req.socket.remoteAddress, data);//invoke handleVerification, see implementation
    }

    if (data.type === 'cmdReq') {
      handleCmdReq(data);// see handleCmdReq implementation
    }
  });

  ws.on('close', (code, reason) => {//see handleClientDisconnect implementation
	console.log(`client disconected reason: ${reason}`);
    handleClientDisconnect(ws);
  });
});

/**
Handles verification logic for a newly connected client

@param ws: WebSocket instance used for newly connected Client

@param ipAddress: IP Address of newly connected client, arrives in IPV6 format

@param data: JSON containing verification data
**/
function handleVerification(ws, ipAddress, data) {
  if (data.clientType) {
    if (data.clientType === 'interface') {
      if (user) {//if user exists
        ws.close();//kick
        console.log('Client kicked: Interface already connected');
      } else {
        const uniqueID = uuidv4();//gen a uniqueID
        user = new Client(data.clientType, uniqueID, ipAddress, ws);//create Client instance
        console.log('Interface client connected');
        user.logClient();//log xlient speciic data to server console
        ws.send(JSON.stringify({ type: 'assignedID', id: uniqueID }));//send generated assignedID to newly connected client
      }
    } else if (data.clientType && validClientTypes.includes(data.clientType)) {//see if data has a clientType attribute AND that clientType is in validClientTypes
      const uniqueID = uuidv4();//gen unique id for newly connected client
      const client = new Client(data.clientType, uniqueID, ipAddress, ws);//create client instance for newly connected client
      clients.set(uniqueID, client);//add client to clients map
      console.log('Client verified successfully, logging info:');
      client.logClient();
      ws.send(JSON.stringify({ type: 'assignedID', id: uniqueID }));//send generated uniqueID to newly connected client
    } else {//if the client trying to connect does not satisfy thew first 2 cases, they are kicked for invalif verificaation data
      ws.close();
      console.log('Invalid client data, connection closed');
    }
  } else {
    ws.close();
    console.log('Invalid client data, connection closed');
  }
}

/*
handles the cmdReqs incoming from interface, parses into a cmdExe and send to the correct Client
correct client determined by data.destID, where data is the parameter value

@param data
*/
function handleCmdReq(data) {
  console.log(`Command request received: ${JSON.stringify(data)}`);
  const { destID, cmdType, cmdMagnitude } = data;//create a destructured json object from data

  if (clients.has(destID)) {//check if the destination ID exists within the clients map
    const cmdExe = { type: 'cmdExe', cmdType, cmdMagnitude };//create cmdExe from parameter json data
    clients.get(destID).ws.send(JSON.stringify(cmdExe));//send the cmdExe to the specified dsesitnation id
    console.log(`Command sent to client ${destID}: ${JSON.stringify(cmdExe)}`);
  } else {// if specified id does not exist in the client map
    console.log(`Invalid destination socket ID: ${destID}`);
  }
}

/*

*/
function handleClientDisconnect(ws) {
  let disconnectedClientID = null;
  for (let [id, client] of clients) {
    if (client.ws === ws) {
      disconnectedClientID = id;
      break;
    }
  }

  if (disconnectedClientID) {
    console.log(`Client disconnected: ${disconnectedClientID}`);
    clients.delete(disconnectedClientID);
    console.log('Client removed from maps');
  }

  if (user && user.ws === ws) {
    console.log('Interface client disconnected');
    user = null;
  }
}


function logServerIP() {
  const interfaces = os.networkInterfaces();
  for (const iface in interfaces) {
    for (const alias of interfaces[iface]) {
      if (alias.family === 'IPv4' && !alias.internal) {
        console.log(`Interface: ${iface}, IP Address: ${alias.address}`);
      }
    }
  }
}

/*
Takes ip address as a parameter, trims leading characters off and returns in ipv4 format if parameter is ipv6
otherwise, the parameter value is returned
DOES NOT HANDLE CASES WHERE PARAMETER IS RANDOM VALUE
DOES NOT VERIFY THAT PARAMETER VALUE IS IN A VALUID IP ADDRESS FORMAT

@param ip: ip address to be trimmed

@return trimmed ip(ipv4 format)
*/
function extractIPv4(ip) {
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  return ip;
} //end extractIPv4

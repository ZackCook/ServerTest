// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Object to store all connected clients
let clients = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // Register the client with a unique ID and type
    socket.on('register', (type, uniqueId) => {
        clients[uniqueId] = { socket, type };
        console.log(`${type} connected: ${uniqueId}`);
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        for (let id in clients) {
            if (clients[id].socket === socket) {
                console.log(`${clients[id].type} disconnected: ${id}`);
                delete clients[id];
                break;
            }
        }
    });

    // Handle incoming commands
    socket.on('command', (command) => {
        console.log('Command received:', command);
        const { targetId, type, value } = command;
        if (clients[targetId]) {
            clients[targetId].socket.emit('command', { type, value });
        } else {
            console.log(`Client with ID ${targetId} not found`);
        }
    });

    // Handle request for client information
    socket.on('getClientInfo', (clientId) => {
        if (clients[clientId]) {
            const clientInfo = {
                type: clients[clientId].type,
                id: clientId
            };
            socket.emit('clientInfo', clientInfo);
        } else {
            socket.emit('clientInfo', { error: 'Client not found' });
        }
    });

    // Handle request for client list
    socket.on('getClientList', () => {
        const clientList = Object.keys(clients).map(id => ({
            id,
            type: clients[id].type
        }));
        socket.emit('clientList', clientList);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const fs = require('fs'); //the file system
//const https = require('https');
const http = require('http');
const express = require('express');
const cors = require('cors');


const socketio = require('socket.io');
const app = express();
app.use(cors()); //open our express api to any domain npm install cors
app.use(express.static(__dirname+'/public'));
app.use(express.json()); //allow us to parse json in the body with the body parser


//const key = fs.readFileSync('./certs/cert.key'); test these in local
//const cert = fs.readFileSync('./certs/cert.crt');


//const expressServer = https.createServer({key, cert}, app); //for local development https

const expressServer = http.createServer({}, app)

const io = socketio(expressServer,{
    cors: [
        'https://localhost:3000',
        'https://localhost:3001',
        'https://localhost:3002',
        'https://www.telecnmgo.com',
        

        //'http://telecnmgo.com', TEST ONLY
    ]
})

expressServer.listen(9000);
module.exports = { io, expressServer, app };

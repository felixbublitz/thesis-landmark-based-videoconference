import {WebSocket as WSWebSocket, WebSocketServer, MessageEvent} from "ws";
import {SocketPackage, AdrSocket, AddressLabel} from "./ws/connection-types";

const express = require('express');
const logging = require('webpack/lib/logging/runtime');

logging.configureDefaultLogger({
    level: 'debug',
    debug: true,
  });

let logger = logging.getLogger("Server");


class Server{
    private readonly httpPort : number = 80;
    private readonly wsPort : number = 2222;
    private app = express();
    private server : WebSocketServer;
    static initClients : number = 0;

    constructor(){
        this.app.use(express.static(__dirname + '/app'));
        this.app.use('/app', express.static(__dirname + '/app'));
        this.app.use('/library', express.static(__dirname + '/library'));
     
        this.app.listen(this.httpPort, () => {
            logger.log('App listening on port ${this.port}')
        })

        this.server = new WebSocketServer({ port : this.wsPort });
        this.server.on('connection', this.connection.bind(this));
    }
    
    private connection(peer : WSWebSocket){
        logger.info("Peer connected");
        peer.on('message', (message : MessageEvent)=>{
            this.receive(message.toString(), <any>peer);
        });  
    }

    private receive(message : string, peer : AdrSocket){
        let pkg = SocketPackage.deserialize(message);
        logger.info("Received event: " + pkg.event + " from " + peer.id + " [" + pkg.id + "]");

        if(pkg.fwdAddr != null){
            this.forwardPackage(pkg);
            return;
        }

        switch(pkg.event){
            case 'register':
                peer.id = Server.initClients++;
                peer.send(pkg.reply({id : peer.id}).serialize());
                logger.info('Socket ' + peer.id + " connected");
                break;
            case 'peer_exists':
                peer.send(pkg.reply({'exists' : this.getSocket(pkg.data.peerID) == null ? false : true}).serialize())
                break;
        }
    }

    private forwardPackage(pkg : SocketPackage){
        logger.info("Forward event: " + pkg.event + " to: " + pkg.fwdAddr.receiver);
        let receiver = this.getSocket(pkg.fwdAddr.receiver);
        if(receiver === null){
            logger.error('Socket ' + pkg.fwdAddr.receiver + " not exists!");
            return;
        }

        this.getSocket(pkg.fwdAddr.receiver).send(pkg.serialize());
    }

    private getSocket(id : number) : AdrSocket{
        let out = null;
        this.server.clients.forEach((item : WSWebSocket)=>{
            let client : AdrSocket = <any>item;
            if(client.id === id){
                out = client;
            }
        });

        return out;
    }
}

new Server();
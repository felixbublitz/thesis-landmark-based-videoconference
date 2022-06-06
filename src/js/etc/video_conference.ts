
import { NormalizedLandmarkList } from "@mediapipe/face_mesh";
import { Encoder } from "../video/encoder";
import { ConnectionHandler } from "../ws/connection_handler";
import { AddressLabel, CallMode, RTCPackage, SocketPackage } from "../ws/connection_types";


export enum Data{
    VIDEO_START,
    VIDEO_END,
    LANDMARK
}

export class VideoConference{
    readonly connectionHandler;
    private encoder : Encoder;

    onConnected(){};
    onPeerConnected(peerId : number){}
    onPeerDisconnected(peerId : number){}
    onPeerData(peerId : number, type : Data, data? : any){};


    get peerId() : number{
        return this.connectionHandler.ownID;
    }

    constructor(wsAddr : string){
        this.connectionHandler = new ConnectionHandler(); 
        
        this.connectionHandler.onStreamsReceived = (peerId,  streams, peer, statsKey) => {
            this.onPeerData(peerId, Data.VIDEO_START, {stream : streams[0], peer : peer, statsKey : statsKey })
        };

        this.connectionHandler.onStreamStopped = (peerId : number) => {
            this.onPeerData(peerId, Data.VIDEO_END);
        };
        
        this.connectionHandler.onPeerConnected = (peerId) => {console.log("opc"); this.onPeerConnected(peerId)};
        this.connectionHandler.onPeerDisconnected = (peerID) => {this.onPeerDisconnected(peerID)};
        this.connectionHandler.onEvent = (ev, data) => {this.onEvent(ev,data)};

        this.connectionHandler.onIDReceived = (ownID) => {
            this.onConnected();
        };

        this.connectionHandler.init(wsAddr);

    }

    setEncoder(encoder : Encoder){
        this.encoder = encoder;

        encoder.onFrameAvailable = (peerId, data) => {
            
            let wireframe = new RTCPackage.WireFrameData();
           /* data.forEach((item : any)=>{
                wireframe.add({ x: item.x, y: item.y, z: item.z} as RTCPackage.Coordinates);
            })*/
            wireframe.add({x : 0.958, y: 0.036, z:0.05} as RTCPackage.Coordinates);

            let pkg = new RTCPackage(RTCPackage.Type.WireframeData, wireframe);
            this.connectionHandler.sendRTCData(peerId, pkg)
        }
    }

    get peers() : RTCPeerConnection[]{
        return this.connectionHandler.getPeers();
    }


    private onEvent(ev : string, data : any){
        switch(ev){
            case 'start_transmission':
                this.startTransmission(data.peerId, data.mode);
                break;
            case 'stop_transmission':
                this.stopTransmission(data.peerId, data.mode);
                break;
            default:

        }
    }

    async call(peerId : number) : Promise<void>{
        return new Promise((resolve, reject)=>{
            if(peerId == this.connectionHandler.ownID){
                reject('illegal peer id');
                return;
            }
            this.connectionHandler.AwaitReply(new SocketPackage('call', {peerId : peerId})).then((pkg : SocketPackage) => {     
                resolve();
            }, (error)=>{
                reject(error);
            });
        });
    }

    
    changeTransmissionMode(mode : CallMode){
        this.connectionHandler.AwaitReply(new SocketPackage('change_mode', {'mode' : mode})).then(()=>{},
        (e)=>{
            console.error(e);
        });
    }


    private async startTransmission(peerId : number, mode : CallMode){
        switch(mode){
            case CallMode.None:
                break;
            case CallMode.Video:
                console.log(this);
                let stream = await this.encoder.getStream();
                this.connectionHandler.addStream(peerId, stream);
                break;
            case CallMode.Wireframe:
                this.encoder.start(peerId, Encoder.Encoding.Wireframe);
                break;
            default:
                throw(new Error("call mode not implemented"));
        }
    }

 

    private stopTransmission(peerId : number, mode : CallMode){

        switch(mode){
            case CallMode.None:
                break;
            case CallMode.Video:
                this.connectionHandler.removeStream(peerId);
                this.connectionHandler.send(new SocketPackage('stream_stopped', null, new AddressLabel(this.connectionHandler.ownID, peerId)));
                break;
            case CallMode.Wireframe:
                this.encoder.stop(peerId);
            break;

            default:
                
        }
    }

}
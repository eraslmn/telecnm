
import peerConfiguration from './stunServers';



const createPeerConnection = (addIce)=> {

    return new Promise(async (resolve, reject) => {
        const peerConnection = await new RTCPeerConnection();
        // rtcpeerconnection is connection to the peer.
        const remoteStream = new MediaStream();
    
        peerConnection.addEventListener('signalingstatechange', (e) => {
            console.log("signaling state change");
            console.log(e);
        });
    
        peerConnection.addEventListener('icecandidate', (e) => {
            console.log("found ice candidate....");
            if (e.candidate) {
               
                addIce(e.candidate)
            }
        });

        peerConnection.addEventListener('track',e=>{
            console.log("got a track from remote")
            e.streams[0].getTracks().forEach(track=>{
                remoteStream.addTrack(track,remoteStream);
                console.log("u sos puna");
            })
        })
    
        resolve({
            peerConnection,
            remoteStream,
        });
    });
}    

export default createPeerConnection
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom"
import axios from 'axios';
import './VideoComponents.css';
import CallInfo from "./CallInfo";
import ChatWindow from "./ChatWindow";
import ActionButtons from "./ActionButton";
import addStream from '../redux-elements/actions/addStream';
import { useDispatch, useSelector } from "react-redux";
import createPeerConnection from "../additions/createPeerConnection";
import socketConnection from '../additions/socketConnection';
import updateCallStatus from "../redux-elements/actions/updateCallStatus";
import proSocketListeners from "../additions/proSocketListeners";

const ProMainVideoPage = ()=>{

    const dispatch = useDispatch();
    const callStatus = useSelector(state=>state.callStatus)
    const streams = useSelector(state=>state.streams)
    //get query string finder hook 
    const [ searchParams, setSearchParams ] = useSearchParams();
    const [ apptInfo, setApptInfo ] = useState({})
    const smallFeedEl = useRef(null); //this is a React ref to a dom element, so we can interact with it the React way
    const largeFeedEl = useRef(null);
    const [ haveGottenIce, setHaveGottenIce ] = useState(false)
    const streamsRef = useRef(null);

    useEffect(()=>{
        //fetch the user media
        const fetchMedia = async()=>{
            const constraints = {
                video: true, //must have one constraint, just dont show it yet
                audio: true, //if you make a video chat app that doesnt use audio, but does (????), then init this as false, and add logic later ... hahaha
            }
            try{
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                dispatch(updateCallStatus('haveMedia',true)); //update our callStatus reducer to know that we have the media
                //dispatch will send this function to the redux dispatcher so all reducers are notified
                //we send 2 args, the who, and the stream
                dispatch(addStream('localStream',stream));
                const { peerConnection, remoteStream } = await createPeerConnection(addIce);
                //we don't know "who" we are talking to... yet.
                dispatch(addStream('remote1',remoteStream, peerConnection));
                
                largeFeedEl.current.srcObject = remoteStream
            }catch(err){
                console.log(err);
            }
        }
        fetchMedia()
    },[])

    useEffect(()=>{
        const getIceAsync = async() => {
             const socket = socketConnection(searchParams.get('token'))
             const uuid = searchParams.get('uuid');
        const iceCandidates = await socket.emitWithAck('getIce',uuid,"professional")
        console.log("icecandidate received");
        console.log(iceCandidates);
        iceCandidates.forEach(iceC=>{
            for (const s in streams) {
                if ( s != 'localStream'){
                    const pc = streams[s].peerConnection;
                    pc.addIceCandidate(iceC)
                    console.log("-----added ice candidate");
                }
            }
        })
        }
        if(streams.remote1 && !haveGottenIce){
            setHaveGottenIce(true);
           getIceAsync()  
           streamsRef.current = streams; //update streamsref
        }
      
    },[streams,haveGottenIce])

    useEffect(()=>{
        const setAsyncOffer = async()=>{
            for(const s in streams){
                if(s !== "localStream"){
                    const pc = streams[s].peerConnection;
                    await pc.setRemoteDescription(callStatus.offer)
                    console.log(pc.signalingstate); //should be have remote offer


                    //hi
                }


            }
        }
        if(callStatus.offer && streams.remote1 && streams.remote1.peerConnection){
            setAsyncOffer()
        }
    },[callStatus.offer,streams.remote1])

    useEffect(()=>{
        const createAnswerAsync = async()=>{
            //we have audio and video, we can make an answer and setLocalDescription
            for(const s in streams){
                if(s !== "localStream"){
                    const pc = streams[s].peerConnection;
                    //make an answer
                    const answer = await pc.createAnswer();
                    //because this is the answering client, the answer is the localDesc
                    await pc.setLocalDescription(answer);
                    console.log(pc.signalingState);//have local answer
                    dispatch(updateCallStatus('haveCreatedAnswer',true))
                    dispatch(updateCallStatus('answer',answer))



                    //emit
                    const token = searchParams.get('token');

                    const socket = socketConnection(token);

                    const uuid = searchParams.get('uuid');

                    socket.emit('newAnswer',{answer,uuid})
                }
            }
        }
        //we only create an answer if audio and video are enabled AND haveCreatedAnswer is false
        //this may run many times, but these 3 events will only happen one
        if(callStatus.audio === "enabled" && callStatus.video === "enabled" && !callStatus.haveCreatedAnswer){
            createAnswerAsync()
        }
    },[callStatus.audio, callStatus.video, callStatus.haveCreatedAnswer])


    useEffect(()=>{
        //grab the token var out of the query string
        const token = searchParams.get('token');
        console.log(token)
        const fetchDecodedToken = async()=>{
            const resp = await axios.post('https://api.telecnmgo.com/validate-link',{token});
            console.log(resp.data);
            setApptInfo(resp.data)
        }
        fetchDecodedToken();
    },[])

    useEffect(() => {
        const token = searchParams.get('token');
        const socket = socketConnection(token);
        proSocketListeners.proVideoSocketListeners(socket,addIceCandidateToPc);
    }, []);

    const addIceCandidateToPc = (iceC)=>{
        //add ice candidate from remote to peerr
        for (const s in streamsRef.current) {
            if(s !== 'localStream'){
                const pc = streamsRef.current[s].peerConnection;
                pc.addIceCandidate(iceC);
                console.log("added an icecandidate to existing pageee")
            }
        }
    }


    const addIce = (iceC)=>{
        const socket = socketConnection(searchParams.get('token'))
        socket.emit('iceToServer',{
            iceC,
            who: 'professional',
            uuid: searchParams.get('uuid')

        })
    }

    return(
        <div className="main-video-page">
            <div className="video-chat-wrapper">
                {/* Div to hold our remote video, our local video, and our chat window*/}
                <video id="large-feed" ref={largeFeedEl} autoPlay controls playsInline></video>
                <video id="own-feed" ref={smallFeedEl} autoPlay controls playsInline></video>
                {callStatus.audio === "off" || callStatus.video === "off" ?
                    <div className="call-info">
                        <h1>
                            {searchParams.get('client')} is in the waiting room.<br />
                            Call will start when video and audio are enabled
                        </h1>
                    </div> : <></>
                }
                <ChatWindow />
            </div>
            <ActionButtons smallFeedEl={smallFeedEl}
            largeFeedEl={largeFeedEl} />
        </div>
    )
}

export default ProMainVideoPage
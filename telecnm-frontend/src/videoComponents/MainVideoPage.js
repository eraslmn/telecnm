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
import clientSocketListeners from "../additions/clientSocketListeners";

const MainVideoPage = ()=>{

    const dispatch = useDispatch();
    const callStatus = useSelector(state=>state.callStatus)
    const streams = useSelector(state=>state.streams)
    //get query string finder hook 
    const [ searchParams, setSearchParams ] = useSearchParams();
    const [ apptInfo, setApptInfo ] = useState({})
    const smallFeedEl = useRef(null); //this is a React ref to a dom element, so we can interact with it the React way
    const largeFeedEl = useRef(null);
    const uuidRef = useRef(null);
    const streamsRef = useRef(null);
    const [ showCallInfo, setShowCallInfo ] = useState(true);

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


                largeFeedEl.current.srcObject = remoteStream; //set video
                
            }catch(err){
                console.log(err);
            }
        }
        fetchMedia()
    },[])


    useEffect(()=>{
        if(streams.remote1){
            streamsRef.current = streams;
        }
    },[streams])





    useEffect(()=>{
        const createOfferAsync = async()=>{
            //we have audio and video and we need an offer. Let's make it!
            for(const s in streams){
                if(s !== "localStream"){
                    try{
                        const pc = streams[s].peerConnection;
                        const offer = await pc.createOffer()
                        pc.setLocalDescription(offer);
                        //get the token from the url for the socket connection
                        const token = searchParams.get('token');
                        //get the socket from socketConnection
                        const socket = socketConnection(token)
                        socket.emit('newOffer',{offer,apptInfo})

                    
                    }catch(err){
                        console.log(err);
                    }
                }
            }
            dispatch(updateCallStatus('haveCreatedOffer',true));
        }
        if(callStatus.audio === "enabled" && callStatus.video === "enabled" && !callStatus.haveCreatedOffer){
            createOfferAsync()
        }
    },[callStatus.audio, callStatus.video, callStatus.haveCreatedOffer])

useEffect(()=>{
    const asyncAddAnswer = async()=>{

        for (const s in streams){
            if(s !== "localStream"){
                const pc = streams[s].peerConnection;
                await pc.setRemoteDescription(callStatus.answer);
                console.log(pc.signalingState);
                console.log("answer addedd");
            }
        }
    }

 if(callStatus.answer){

    asyncAddAnswer()

    }
},[callStatus.answer])


    useEffect(()=>{
        //grab the token var out of the query string
        const token = searchParams.get('token');
        console.log(token)
        const fetchDecodedToken = async()=>{
            const resp = await axios.post('https://localhost:9000/validate-link',{token});
            console.log(resp.data);
            setApptInfo(resp.data)
            uuidRef.current = resp.data.uuid;
        }
        fetchDecodedToken();
    },[])

    useEffect(() => {
        const token = searchParams.get('token');
        const socket = socketConnection(token);
        clientSocketListeners(socket,dispatch, addIceCandidateToPc);
    }, []);

    const addIceCandidateToPc = (iceC)=>{
        //add ice candidate from remote to peerr
        for (const s in streamsRef.current) {
            if(s !== 'localStream'){
                const pc = streamsRef.current[s].peerConnection;
                pc.addIceCandidate(iceC);
                console.log("added an icecandidate to existing pageee")
                setShowCallInfo(false);
            }
        }
    }

   const addIce = (iceC)=>{
    //emit new icecandidate to signaling sevrrer
    const socket = socketConnection(searchParams.get('token'));
    socket.emit('iceToServer',{
        iceC,
        who: 'client',
        uuid: uuidRef.current, 
    })

   }

    return(
        <div className="main-video-page">
            <div className="video-chat-wrapper">
                {/* Div to hold our remote video, our local video, and our chat window*/}
                <video id="large-feed" ref={largeFeedEl} autoPlay controls playsInline></video>
                <video id="own-feed" ref={smallFeedEl} autoPlay controls playsInline></video>
                {showCallInfo ? <CallInfo apptInfo={apptInfo} /> : <></>}
                <ChatWindow />
            </div>
            <ActionButtons
             smallFeedEl={smallFeedEl} 
             largeFeedEl={largeFeedEl} 
             />
        </div>
    )
}

export default MainVideoPage
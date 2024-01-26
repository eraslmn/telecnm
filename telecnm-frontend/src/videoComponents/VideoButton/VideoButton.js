import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from 'react';
import startLocalVideoStream from "./startLocalVideoStream";
import updateCallStatus from "../../redux-elements/actions/updateCallStatus";
import getDevices from "./getDevices";
import addStream from "../../redux-elements/actions/addStream";
import ActionButtonCaretDropDown from "../ActionButtonCaretDropDown";

const VideoButton = ({ smallFeedEl }) => {

     const dispatch = useDispatch();
    const callStatus = useSelector(state => state.callStatus);
    const streams = useSelector(state => state.streams);
    const [ pendingUpdate, setPendingUpdate ] = useState(false);
    const [ caretOpen, setCaretOpen ] = useState(false);
    const [ videoDeviceList, setVideoDeviceList ] = useState([]);

    const DropDown = ()=>{

        

        return(

            <div className="caret-dropdown" style={{top:"-25px"}}>
                <select defaultValue = {callStatus.videoDevice} onChange={changeVideoDevice}>
                    {videoDeviceList.map(vd=><option key={vd.deviceId} value={vd.deviceId}>{vd.label}</option>)}
                </select>
            </div>
        )
    }


    useEffect(()=>{

        const getDevicesAsync = async()=>{

                    if(caretOpen){
                        const devices = await getDevices();
                        console.log(devices.videoDevices)
                        setVideoDeviceList(devices.videoDevices)
                    }
    }

    getDevicesAsync()
    },[caretOpen])

    const changeVideoDevice = async(e)=>{

        const deviceId = e.target.value;
        //console.log(deviceId);
        const newConstraints = {
            audio: callStatus.audioDevice === "default" ? true : { deviceId: { exact: callStatus.audioDevice } },
            video: { deviceId: { exact: deviceId } }
        }
        const stream = await navigator.mediaDevices.getUserMedia(newConstraints)


        dispatch(updateCallStatus('videoDevice',deviceId));
        dispatch(updateCallStatus('video','enabled'));

        const [videoTrack] = stream.getVideoTracks();
        //getsenders will grab all rtcsenders that the pc has

        for(const s in streams){
            if(s !== "localStream"){
                const senders = streams[s].peerConnection.getSenders();
                const sender = senders.find(s=>{
                    if (s.track){
                        return s.track.kind === videoTrack.kind
                    }else{
                        return false;
                    }
                })
                sender.replaceTrack(videoTrack)
            }
        }



        //come back to this later!!

        smallFeedEl.current.srcObject = stream;

        dispatch(addStream('localStream',stream));

    }
    const startStopVideo = () => {

        if(callStatus.video === "enabled"){
            dispatch(updateCallStatus('video',"disabled"));

            const tracks = streams.localStream.stream.getVideoTracks();
            tracks.forEach(t=>t.enabled = false);

        }else if(callStatus.video === "disabled"){

            dispatch(updateCallStatus('video',"enabled"));
            const tracks = streams.localStream.stream.getVideoTracks();
            tracks.forEach(t=>t.enabled = true);

        }else if (callStatus.haveMedia) {

            smallFeedEl.current.srcObject = streams.localStream.stream;

            startLocalVideoStream(streams, dispatch);

        }else{

            setPendingUpdate(true);
        }
    }

    useEffect(()=>{
        if(pendingUpdate && callStatus.haveMedia){
        console.log('pending update succeeded!')
        setPendingUpdate(false)
        smallFeedEl.current.srcObject = streams.localStream.stream;
        startLocalVideoStream(streams, dispatch);


        }
    },[pendingUpdate,callStatus.haveMedia])



    return (
        <div className="button-wrapper video-button d-inline-block">
            <i className="fa fa-caret-up choose-video" onClick={()=>setCaretOpen(!caretOpen)}></i>
            <div className="button camera" onClick={startStopVideo}>
                <i className="fa fa-video"></i>
                <div className="btn-text">
                    {callStatus.current.video === "enabled" ? "Stop" : "Start"} Video
                </div>
            </div>
            {caretOpen ? <ActionButtonCaretDropDown 
                            defaultValue={callStatus.videoDevice} 
                            changeHandler={changeVideoDevice}
                            deviceList={videoDeviceList}
                            type="video"
                        /> : <></>}
        </div>
    );
};

export default VideoButton;

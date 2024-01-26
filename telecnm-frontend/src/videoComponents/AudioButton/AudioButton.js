import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"
import ActionButtonCaretDropDown from "../ActionButtonCaretDropDown";
import getDevices from "../VideoButton/getDevices";
import updateCallStatus from "../../redux-elements/actions/updateCallStatus";
import addStream from "../../redux-elements/actions/addStream";
import startAudioStream from "./startAudioStream";

const AudioButton = ({smallFeedEl})=>{

    const dispatch = useDispatch()

    const callStatus = useSelector(state=>state.callStatus);
    const streams = useSelector(state=>state.streams);
    const [ caretOpen, setCaretOpen ] = useState(false);
    const [ audioDeviceList, setAudioDeviceList ] = useState([]);

    let micText;
    if(callStatus.audio === "off"){
        micText = "Join Audio"
    }else if(callStatus.audio === "enabled"){
        micText = "Mute"
    }else{
        micText = "Unmute"
    }

    useEffect(()=>{
        const getDevicesAsync = async()=>{
            if(caretOpen){
                //then we need to check for audio devices
                const devices = await getDevices();
                console.log('Devices:', devices); // 
                setAudioDeviceList(devices.audioOutputDevices.concat(devices.audioInputDevices))
            }
        }
        getDevicesAsync()
    },[caretOpen])


    const startStopAudio = ()=>{
        if(callStatus.audio === "enabled"){
            dispatch(updateCallStatus('audio',"disabled"));

            const tracks = streams.localStream.stream.getAudioTracks();
            tracks.forEach(t=>t.enabled = false);

        }else if(callStatus.audio === "disabled"){

            dispatch(updateCallStatus('audio',"enabled"));
            const tracks = streams.localStream.stream.getAudioTracks();
            tracks.forEach(t=>t.enabled = true);
        }else{
            //audio is off
            changeAudioDevice({ target: { value: "inputdefault" } });
            //add tracks to peercon
            startAudioStream(streams);

        }
    }
    const changeAudioDevice = async(e)=>{
        console.log(e.target.value)
        const deviceId = e.target.value.slice(5);
        const audioType = e.target.value.slice(0,5);
        console.log(e.target.value)

        if(audioType === "output")
        {
            smallFeedEl.current.setSinkId(deviceId);

        }else if (audioType === "input") {
            const newConstraints = {
                audio: { deviceId: { exact: deviceId } } ,
                video: callStatus.videoDevice === "default" ? true : { deviceId: { exact: callStatus.videoDevice } }
            }
            const stream = await navigator.mediaDevices.getUserMedia(newConstraints)
    
            dispatch(updateCallStatus('audioDevice',deviceId));
            dispatch(updateCallStatus('audio','enabled'));
            
        dispatch(addStream('localStream',stream));
//replacetracks
        const [ audioTrack] = stream.getAudioTracks();
        //come back to this later!!
        for(const s in streams){
            if(s !== "localStream"){
                const senders = streams[s].peerConnection.getSenders();
                const sender = senders.find(s=>{
                    if (s.track){
                        return s.track.kind === audioTrack.kind
                    }else{
                        return false;
                    }
                })
                sender.replaceTrack(audioTrack)
            }
        }
        }

    }

    return(
        <div className="button-wrapper d-inline-block">
            <i className="fa fa-caret-up choose-audio" onClick={()=>setCaretOpen(!caretOpen)}></i>
            <div className="button mic" onClick={startStopAudio}>
                <i className="fa fa-microphone"></i>
                <div className="btn-text">{micText}</div>
            </div>
            {caretOpen ? <ActionButtonCaretDropDown 
                            defaultValue={callStatus.audioDevice} 
                            changeHandler={changeAudioDevice}
                            deviceList={audioDeviceList}
                            type="audio"
                        /> : <></>}
        </div>        
    )
}

export default AudioButton
import updateCallStatus from '../redux-elements/actions/updateCallStatus';

const proDashabordSocketListeners = (socket, setApptInfo, dispatch) => {
    socket.on('apptData', apptData => {
        console.log('Received apptData:', apptData);
        setApptInfo(apptData);
    });

    socket.on('newOfferWaiting', offerData => {
        console.log('Received newOfferWaiting:', offerData);
        // dispatch the offer to Redux so that it is available for later
        dispatch(updateCallStatus('offer', offerData.offer));
        dispatch(updateCallStatus('myRole', 'answerer'));
    });
}

const proVideoSocketListeners = (socket,addIceCandidateToPc)=>{
    socket.on('iceToClient',iceC=>{
        addIceCandidateToPc(iceC)
    })

}

export default { proDashabordSocketListeners, proVideoSocketListeners }
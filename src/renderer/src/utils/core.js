const peerConnectionMap = new Map()
const SIGNAL_TYPE_OFFER = 'offer'
const SIGNAL_TYPE_ANSWER = 'answer'
const SIGNAL_TYPE_CANDIDATE = 'candidate'

const createPeerConnection = (member, cameraEnable, micEnable, userId) => {
    let peerConnection = peerConnectionMap.get(member.userId)
    if (peerConnection) {
        return peerConnection
    }
    peerConnection = new RTCPeerConnection({
        sdpSemantics: 'unified-plan',
        codecs: { video: 'VP8' },
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require',
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302',
            }
        ]
    })
    if (!cameraEnable) {
        peerConnection.addTransceiver('video', { direction: 'sendonly' })
    }
    if (!micEnable) {
        peerConnection.addTransceiver('audio', { direction: 'sendonly' })
    }
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('candidate', event.candidate)
            sendPeerMessage({
                sendUserId: userId,
                signalType: SIGNAL_TYPE_CANDIDATE,
                signalData: event.candidate,
                receiveUserId: member.userId,
            })
        }
    }
    peerConnection.ontrack = (event) => {
        console.log('ontrack', event)
    }
    peerConnection.oniceconnectionstatechange = (event) => {
        console.log('oniceconnectionstatechange', event)
    }
    // 当本地 ICE 代理的 “候选者收集状态” 发生变化时触发，用于监控候选者的收集进度
    peerConnection.onicegatheringstatechange = (event) => {
        peerConnectionMap.set(member.userId, peerConnection)
        // 为peerConnection添加音视频轨道
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream)
        })
    }
    return peerConnection
}
const sendPeerMessage = ()=>{
    
}
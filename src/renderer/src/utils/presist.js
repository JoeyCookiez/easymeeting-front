const getMeetingInfo = ()=>{
    return JSON.parse(localStorage.getItem("meetingInfo"))||{}
}

const saveMeetingInfo = (data)=>{
    localStorage.setItem("meetingInfo",JSON.stringify(data))
    return
}

const getUserInfo = ()=>{
    return JSON.parse(localStorage.getItem("userInfo")) || {}
}

const saveUserInfo = (data)=>{
    localStorage.setItem("userInfo",JSON.stringify(data))
    return     
}

const getUserStatus = ()=>{
    return JSON.parse(localStorage.getItem("userStatus")) || {}
}

const saveUserStatus = (data)=>{
    localStorage.setItem("userStatus",JSON.stringify(data))
    return
}

const getInMeeting = ()=>{
    return localStorage.getItem("inMeeting") === 'true' ? true : false
}

const saveInMeeting = (inMeeting)=>{
    localStorage.setItem("inMeeting",inMeeting)
    return
}
export {
    getMeetingInfo,
    saveMeetingInfo,
    getUserInfo,
    saveUserInfo,
    getUserStatus,
    saveUserStatus,
    getInMeeting,
    saveInMeeting
}
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


export {
    getMeetingInfo,
    saveMeetingInfo,
    getUserInfo,
    saveUserInfo
}
import { param2String } from "../utils/all";
import request from "../utils/request";

export function preJoinMeeting(data){
    return request({
        url: "/meetingInfo/preJoinMeeting?" + param2String(data),
        method: "post"
    })
}

export function joinMeeting(data){
    return request({
        url: "/meetingInfo/joinMeeting?"+param2String(data),
        method:"post"
    })
}
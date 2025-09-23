import { param2String } from "../utils/all";
import request from "../utils/request";

export function login(data) {
    return request({
        url: "/userInfo/login?" + param2String(data),
        // param: data,
        method: "post"
    })
}

export function register(data) {
    return request({
        url: "/userInfo/register?" + param2String(data),
        // param: data,
        method: "post"
    })
}

export function logout(){
    return request({
        url: '/userInfo/logout',
        method: "get"
    })
}
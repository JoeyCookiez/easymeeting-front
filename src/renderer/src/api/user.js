import request from "../utils/request";

export function login(data) {
    return request({
        url: "/userInfo/login",
        param: data,
        method: "post"
    })
}

export function register(data) {
    return request({
        url: "/userInfo/register",
        param: data,
        method: "post"
    })
}
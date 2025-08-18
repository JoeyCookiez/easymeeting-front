import request from "../utils/request";

export function getCheckCodeImg(captchaId){
    console.log('captchaID',captchaId)
    return request({
        url: "/captcha/image/" + captchaId,
        method: "get",
        responseType: 'blob'
    })
}

export function getCheckCodeUUID(){
    return request({
        url: "/captcha/new",
        method: "get"
    })
}
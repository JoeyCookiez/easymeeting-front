const param2String = (param) => {
    if(!param || typeof param !== "object" || Array.isArray(param)) {
        return "";
    }
    
    return Object.entries(param)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
}

export {
    param2String
}
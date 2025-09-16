const param2String = (param) => {
    if(!param || typeof param !== "object" || Array.isArray(param)) {
        return "";
    }
    
    return Object.entries(param)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
}
const getCurHourAndMinutes = ()=>{
    const now = new Date()
    const hours = now.getHours().toString().padStart(2,'0')
    const minutes = now.getMinutes().toString().padStart(2,'0')
    const timeString = `${hours}:${minutes}`
    return timeString
}
export {
    param2String,
    getCurHourAndMinutes
}
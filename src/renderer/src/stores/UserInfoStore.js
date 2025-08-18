import { defineStore } from "pinia";

export const useUserInfoStore = defineStore("userInof",{
    state:()=>{
        return{
            userInfo:{}
        }
    },
    actions:{
        setInfo(userInfo){
            this.userInfo = userInfo
            localStorage.setItem("userInfo",JSON.stringify(userInfo))
        },
        getInfo(){
            return this.userInfo
        }
    }
})
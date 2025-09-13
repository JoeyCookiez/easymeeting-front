<template>
    <div class="chatroom-container">
        <div class="chat-display-view">

        </div>
        <div class="chat-toolbar">

        </div>
        <div class="chat-input-view">
            <textarea class="chat-textarea"></textarea>
            <div class="chat-message-send">
                <div class="chat-message-send-btn">发送</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const messageList = ref([
    {
        
    }
])
</script>

<style lang="scss" scoped>
.chatroom-container{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: rgb(222,229,244);
    .chat-display-view{
        height: 60%;
    }
    .chat-toolbar{
        height: 36px;
        background-color: #afafaf;
    }
    .chat-input-view{
        display: flex;
        flex-direction: column;
        flex: 1;
    }
    .chat-textarea{
        width: 100%;
        height: 94%;
        background-color: aqua;
        border: none;
        outline: none;
        padding: 6px;
    }
    .chat-message-send{
        flex: 1;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        .chat-message-send-btn{
            display: flex;
            width: 50px;
            height: 26px;
            padding: 5px;
            align-items: center;
            justify-content: center;
            background-color: antiquewhite;
            border-radius: 6px;
            color: #000;
            &:hover{
                color:  rgb(0,111,255);
            }
        }
    }
}
</style>
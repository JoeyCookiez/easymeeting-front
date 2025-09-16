<template>
    <div class="chatroom-container">
        <div :ref="scrollRef" class="chat-display-view">
            <div class="message-box" v-for="msg in messageList" :key="msg.index">
                <div class="message-area">
                    <div class="message-time">{{ msg.time }}</div>
                    <div v-for="item in msg.chatRecords" class="message-row">
                        <div class="left-panel">
                            <div class="message-bubble" v-html="item.content">
                            </div>
                        </div>
                        <div class="right-panel">
                            <div class="chat-avatar">
                                <img :src="item.avatar" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="chat-toolbar">
            <div class="func-area">
                <div class="func-btn" @mouseenter="changeImg(emoji_hover, 'enter')"
                    @mouseleave="changeImg(emoji_normal, 'exit')">
                    <img ref="emojiRef" @click="handlEmojiClick" :src="emoji_normal" />
                    <div v-if="isEmojiBubble" class="emoji-bubble" @mouseenter="changeImg(emoji_hover, 'enter')"
                        @mouseleave="changeImg(emoji_normal, 'exit')">
                        <div class="func-btn" @click="handleChooseEmoji(key)" @mousedown.prevent
                            v-for="(icon, key, index) in emojiList">
                            <img :src="icon" :key="key" />
                        </div>
                    </div>
                </div>
                <div class="func-btn">
                    <img :src="file_icon" />
                </div>
            </div>
        </div>
        <div class="chat-input-view">
            <div class="chat-textarea" contenteditable="true" spellcheck="false" ref="editorRef" @input="onInput"></div>
            <!-- <textarea v-model="message" spellcheck="false" class="chat-textarea"></textarea> -->
            <div class="chat-message-send">
                <div class="chat-message-send-btn" @click="handleSendMessage">发送</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import file_icon from '../assets/icons/file.svg'
import emoji_normal from '../assets/icons/interactive_emoji_normal.svg'
import emoji_hover from '../assets/icons/interactive_emoji_hover.svg'
import { emojiMap } from '../../../main/config';
import { MessageTypeEnum } from '../enums/messageTypeEnum';
import { getUserInfo } from '../utils/presist';
import { getCurHourAndMinutes } from '../utils/all';

const scrollRef = ref(null)
const emojiRef = ref(null)
const isEmojiBubble = ref(false)
const message = ref('')
const editorRef = ref(null)
const emojiList = emojiMap
const userInfo = getUserInfo()
const messageList = ref([
    {
        "time": "11:09",
        "index": '1',
        "chatRecords": [
            {
                "content": "<img src=\"/src/assets/emoji/emoji_0.png\" style=\"width:30px;height:30px\">",
                "sendUserId": "915445853510",
                "sendUserName": "王皓",
                "avatar": "http://localhost:8080/file/TimBoll.jpg"
            },
            {
                "content": "<img src=\"/src/assets/emoji/give_like_6.png\" style=\"width:30px;height:30px\">",
                "sendUserId": "915445853510",
                "sendUserName": "王皓",
                "avatar": "http://localhost:8080/file/TimBoll.jpg"
            }
        ]
    }
])
const insertNodeAtCursor = (node) => {
    const el = editorRef.value
    el && el.focus()
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        range.deleteContents()
        range.insertNode(node)
        // 将光标移到插入节点之后
        range.setStartAfter(node)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
    } else {
        // 没有选区就直接追加
        el.appendChild(node)
    }
}
const focusAndCollapseEnd = () => {
    editorRef.value.focus()
    const sel = window.getSelection()
    const range = document.createRange()
}
const onInput = () => {
    // const msgContent = editorRef.value.innerHTML
    // console.log(msgContent)
}
const handlEmojiClick = () => {
    isEmojiBubble.value = !isEmojiBubble.value
}
const handleChooseEmoji = (key) => {
    const emojiSvg = emojiList[key]
    // console.log(emojiSvg)
    isEmojiBubble.value = !isEmojiBubble.value
    editorRef.value.innerHTML += `<img src="${emojiSvg}" style="width:30px;height:30px"/>`
}
const handleSendMessage = () => {
    // console.log("handleSendMessage")
    const payload = {
        type: MessageTypeEnum.CHAT_MEDIA_MESSAGE,
        sendUserId: userInfo?.userId,
        openVideo: null,
        openMicro: null,
        time: getCurHourAndMinutes(),
        message: editorRef.value.innerHTML
    }
    sendGeneralMessage(payload)
    editorRef.value.innerHTML = ''
}
const sendGeneralMessage = (data) => {
    window.electron.ipcRenderer.send('onSendGeneralMessage', data)
}
const changeImg = (imgSrc, type) => {
    // 如果已经显示了则阻止所有的修改图标事件
    if (isEmojiBubble.value) {
        return
    }
    emojiRef.value.src = imgSrc
}
onMounted(() => {
    window.electronAPI.onWsMessage((message) => {
        const msgJson = typeof message == 'object' ? message : JSON.parse(message)
        const { messageType, sendUserId, receiveUserId, messageContent } = msgJson
        console.warn('message type:', messageType)
        switch (messageType) {
            case MessageTypeEnum.CHAT_MEDIA_MESSAGE:
                console.log(messageContent)
                messageContent.sort((a,b)=>{
                    const [ah,am] = a.time.split(':').map(Number)
                    const [bh,bm] = b.time.split(':').map(Number)
                    if(ah==bh){
                        return am-bm
                    }
                    return ah-bh
                })
                messageList.value = messageContent
        }
    })
})
</script>

<style lang="scss" scoped>
.chatroom-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: rgb(222, 229, 244);

    .chat-display-view {
        height: 450px;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;

        .message-box {
            .message-area{
                display: flex;
                flex-direction: column;
                .message-time{
                    display: flex;
                    justify-content: center;
                    color: #000;
                    font-size: 15px;
                }
            }
            // align-items: flex-end;
            .message-row {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 15px;
            }

            .left-panel {
                max-width: 70%;
                margin-right: 10px;

                .message-bubble {
                    background-color: #95ec69;
                    color: #000;
                    padding: 4px;
                    border-radius: 4px;
                    position: relative;
                    word-wrap: break-word;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

                    p {
                        margin-top: 5px;
                        margin-bottom: 5px;
                    }

                    &::after {
                        content: '';
                        position: absolute;
                        right: -8px;
                        top: 8px;
                        width: 0;
                        height: 0;
                        border-left: 8px solid #95ec69;
                        border-top: 8px solid transparent;
                        border-bottom: 8px solid transparent;
                    }

                    img {
                        max-width: 200px;
                        height: auto;
                        object-fit: cover;
                        border-radius: 8px;
                    }
                }
            }

            .right-panel {
                .chat-avatar {
                    img {
                        width: var(--chat-room-avatar-size);
                        height: var(--chat-room-avatar-size);
                        border-radius: 50%;
                        border: 2px solid #fff;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                    }
                }
            }
        }
    }

    .chat-toolbar {
        height: 36px;
        // background-color: #afafaf;
        border-bottom: 1px solid #afafaf;
        border-top: 1px solid #afafaf;
        display: flex;
        padding: 5px;
        justify-content: flex-end;
        background-color: rgb(237, 237, 237);

        .func-area {
            display: flex;

            .func-btn {
                display: flex;
                flex-direction: column;
                position: relative;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                width: var(--chat-room-func-btn-size);
                height: var(--chat-room-func-btn-size);

                img {
                    width: var(--chat-room-func-icon-size);
                    height: var(--chat-room-func-icon-size);
                }

                &:hover {
                    // background-color: rgb(229,229,229);
                    background-color: rgb(225, 225, 225);
                    border-radius: 6px;
                }
            }
        }

        .emoji-bubble {
            background-color: #fff;
            position: absolute;
            border-radius: 4px;
            // width: 300px;
            // height: 200px;
            bottom: 50px;
            right: -20px;
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            padding: 10px;

            &::after {
                content: '';
                position: absolute;
                bottom: -9px;
                /* 定位在气泡下方 */
                right: 30px;
                /* 调整位置 */
                width: 0;
                height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-top: 10px solid #fff;
                /* 三角形颜色与气泡相同 */
            }
        }

        .emoji-bubble-extra {
            height: 10px;
            width: 100%;
        }
    }

    .chat-input-view {
        flex: 1;
        display: flex;
        flex-direction: column;
        // height: 80px;
        // padding: 10px;
        // background-color: #f5f5f5;
        border-top: 1px solid #e0e0e0;
    }

    .chat-textarea {
        flex: 1;
        // height: 60px;
        // background-color: #fff;
        color: black;
        border: none;
        outline: none;
        padding: 5px;
        resize: none;
        font-size: 14px;
        line-height: 1.4;
        background-color: rgb(222, 229, 244);

        &:focus {
            border-color: #95ec69;
        }
    }

    .chat-message-send {
        margin-left: 10px;
        display: flex;
        align-items: center;
        justify-content: flex-end;

        .chat-message-send-btn {
            display: flex;
            width: 60px;
            height: 40px;
            align-items: center;
            justify-content: center;
            background-color: #95ec69;
            border-radius: 6px;
            color: #000;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;

            &:hover {
                background-color: #7dd85a;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(149, 236, 105, 0.3);
            }

            &:active {
                transform: translateY(0);
            }
        }
    }
}
</style>
<template>
	<div class="meeting-room">
		<!-- 顶部标题栏 -->
		<div class="top-bar">
			<div class="left">
				<div class="title">会议 {{ meetingId || '—' }}</div>
				<div class="sub">{{ nickName ? `您以「${nickName}」加入` : '您已加入会议' }}</div>
			</div>
			<div class="mid-bar">
				<div class="layout">
					<span class="layout-region" @click="toggleBubble">
						<img src="../../assets/icons/layout.png"></img>
						<p>布局</p>
					</span>
				</div>
				<div v-if="isPop" class="bubble">
					<div @click="changeLayout('four')">
						<img src="../../assets/icons/fourGrid.png"></img>
						<p>四宫格</p>
					</div>
					<div @click="changeLayout('nine')">
						<img src="../../assets/icons/nineGrid.png"></img>
						<p>九宫格</p>
					</div>
				</div>
			</div>
			<div class="right window-controls">
				<button class="control-btn min-btn" title="最小化" @click="controlWindow('minimize')">─</button>
				<button class="control-btn max-btn" title="最大化/还原" @click="controlWindow('maximize')">⬜</button>
				<button class="control-btn close-btn" title="关闭" @click="controlWindow('close')">×</button>
			</div>
		</div>

		<!-- 会议信息悬浮显示 -->
		<div class="meeting-info">
			<div class="info-item">
				<span class="label">会议号:</span>
				<span class="value">{{ meetingId || '—' }}</span>
			</div>
			<div class="info-item">
				<span class="label">时长:</span>
				<span class="value">{{ durationText }}</span>
			</div>
			<div class="info-item">
				<span class="label">网络:</span>
				<span class="value" :class="networkQuality">{{ networkLabel }}</span>
			</div>
		</div>

		<!-- 主体：视频网格 -->
		<div class="content">
			<div class="video-area">
				<div class="grid" :class="gridType">
					<div class="video-card self" :class="{ muted: isMuted || !micAvailable, cameraOff: !cameraOn }">
						<div class="avatar" v-if="!cameraOn">{{ avatarInitial }}</div>
						<video v-else autoplay muted playsinline ref="localVideo"></video>
						<div class="name-tag">{{ nickName || '我' }}</div>
					</div>
					<div class="video-card" v-for="member in filteredMemberList">
						<div class="avatar" v-if="!member?.openVideo">{{ member?.nickName?.slice(0, 1).toUpperCase() }}
						</div>
						<!-- <video v-else autoplay playsinline :id="`video-${member.userId}`"
							@loadedmetadata="handleVideoLoaded($event, member.userId)"></video> -->
						<video v-else autoplay playsinline :ref="el=> setVideoRef(el,member?.userId)"
							@loadedmetadata="handleVideoLoaded($event,member?.userId)"></video>
						<div class="name-tag">{{ member?.nickName }}</div>
					</div>
					<!-- <div class="video-card placeholder" v-for="n in 3" :key="n">
						<div class="avatar">N{{ n }}</div>
						<div class="name-tag">参会者 {{ n }}</div>
					</div> -->
				</div>
			</div>
		</div>

		<!-- 底部控制栏 -->
		<div class="bottom-bar">
			<div class="controls">
				<el-button :type="isMuted ? 'danger' : 'primary'" @click="toggleMute">{{ microOn ? '禁音' : '解除静音'
				}}</el-button>
				<el-button :type="cameraOn ? 'primary' : 'warning'" @click="toggleCamera">{{ cameraOn ? '停止视频' : '开启视频'
				}}</el-button>
				<el-button @click="shareScreen">共享屏幕</el-button>
				<el-button @click="invite">邀请</el-button>
				<el-button @click="toggleMembers">成员</el-button>
				<el-button @click="toggleChat">聊天</el-button>
				<el-button @click="toggleRecord">{{ recording ? '停止录制' : '录制' }}</el-button>
			</div>
			<div class="actions">
				<el-button type="danger" @click="endMeeting">结束会议</el-button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { useUserInfoStore } from '../../stores/UserInfoStore'
import { exitMeeting } from '../../api/meeting'
import { MessageTypeEnum } from '../../enums/messageTypeEnum'
const userStore = useUserInfoStore()
const route = useRoute()
const router = useRouter()
const curMemberList = ref([])
const meetingId = computed(() => route.params.meetingId)
const nickName = computed(() => route.query.nickName || '')
const localStream = ref(null)
const isMuted = ref(false)
const cameraOn = ref(route.query.video === '1')
const microOn = ref(route.query.micro === '1')
const localVideo = ref(null)
const recording = ref(false)
const isPop = ref(false)
const gridType = ref('four')
const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {}
// 会议时长
const startAt = Date.now()
const durationText = ref('00:00:00')
let timer = null
const formatDuration = (ms) => {
	const sec = Math.floor(ms / 1000)
	const h = String(Math.floor(sec / 3600)).padStart(2, '0')
	const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
	const s = String(sec % 60).padStart(2, '0')
	return `${h}:${m}:${s}`
}
const peerConnectionMap = new Map()
const dataChannelMap = new Map()
const SIGNAL_TYPE_OFFER = 'offer'
const SIGNAL_TYPE_ANSWER = 'answer'
const SIGNAL_TYPE_CANDIDATE = 'candidate'
const audioTrack = ref(null)
const videoTrack = ref(null)
const videoRefs = ref({})
const setVideoRef = (el,userId)=>{
	if(el){
		videoRefs.value[userId] = el
	}else{
		delete videoRefs.value[userId]
	}
}
// 在 script 部分
const filteredMemberList = computed(() => {
	return curMemberList.value.length>1? curMemberList.value.filter(member => member.userId !== userInfo?.userId): [];
});
const handleVideoLoaded = (event, userId) => {
	const video = event.target
	// video.play().catch(e => console.log(`${userId} 用户视频显示失败`, e))
	playVideoWithRetry(video,userId)
}
// 管理本地媒体流
const manageMediaTracks = async () => {
	try {
		// 清理现有轨道
		if (localStream.value) {
			localStream.value.getTracks().forEach(track => track.stop())
			localStream.value = null
		}

		// 只当至少一种设备启用时才获取新流
		if (microOn.value || cameraOn.value) {
			const constraints = {
				audio: microOn.value,
				video: cameraOn.value
			}

			localStream.value = await navigator.mediaDevices.getUserMedia(constraints)

			if (localVideo.value) {
				localVideo.value.srcObject = localStream.value
				console.log("📹 本地视频流已更新")
			}
		} else {
			if (localVideo.value) {
				localVideo.value.srcObject = null
			}
			console.log("📹 本地媒体设备已关闭")
		}
	} catch (err) {
		console.error('访问媒体设备失败:', err)
		// 回滚状态
		microOn.value = !microOn.value
		cameraOn.value = !cameraOn.value
		ElMessage.error(`无法访问设备: ${err.message}`)
	}
}
const updatePeerConnectionTracks = async (peerConnection, userId) => {
	// 1. 移除所有现有轨道
	peerConnection.getSenders().forEach(sender => {
		if (sender.track) {
			peerConnection.removeTrack(sender)
			sender.track.stop()
		}
	})

	// 2. 添加当前流的所有轨道
	if (localStream.value) {
		const newStream = await navigator.mediaDevices.getUserMedia({
			audio: microOn.value,
			video: cameraOn.value
		})

		newStream.getTracks().forEach(track => {
			peerConnection.addTrack(track, newStream)
		})

		// 3. 确保有本地视频引用时更新它
		if (localVideo.value) {
			localVideo.value.srcObject = newStream
		}

		localStream.value = newStream
	}

	// 4. 触发重新协商
	try {
		const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
		await peerConnection.setLocalDescription(offer)

		sendPeerMessage({
			sendUserId: userInfo?.userId,
			signalType: SIGNAL_TYPE_OFFER,
			signalData: offer,
			receiveUserId: userId
		})
		console.log(`✅ 向用户 ${userId} 发送了重新协商OFFER`)
	} catch (error) {
		console.error(`为 ${userId} 用户重新创建offer时出错:`, error)
	}
}
const updateAllPeerConnections = async () => {
	const updatePromises = []

	peerConnectionMap.forEach((peerConnection, userId) => {
		console.log('peerConncetion', peerConnection, 'userId', userId)
		updatePromises.push(updatePeerConnectionTracks(peerConnection, userId))
	})

	await Promise.all(updatePromises)
}

const createPeerConnection = (member, cameraEnable, micEnable, userId) => {
	let peerConnection = peerConnectionMap.get(member.userId)
	if (peerConnection) {
		return peerConnection
	}
	peerConnection = new RTCPeerConnection({
		sdpSemantics: 'unified-plan',
		codecs: { video: 'VP8' },
		bundlePolicy: 'balanced',
		rtcpMuxPolicy: 'require',
		iceServers: [
			{
				urls: 'stun:stun.l.google.com:19302',
			}
		]
	})

	const dataChannel = peerConnection.createDataChannel("chat", { negotiated: true, id: 0 })
	dataChannel.onopen = (event) => {
		console.log("peer dataChannel 已打开", event)
		// dataChannel.send("Hi you!")
	}
	dataChannel.onmessage = (event) => {
		console.log("peer dataChannel 监听来自对方的数据", event.data)
	}
	// 将dataChannel存到map中
	dataChannelMap[member?.userId] = dataChannel

	if (!cameraEnable) {
		peerConnection.addTransceiver('video', { direction: 'sendonly' })
	}
	if (!micEnable) {
		peerConnection.addTransceiver('audio', { direction: 'sendonly' })
	}
	peerConnection.onicecandidate = (event) => {
		if (event.candidate) {
			console.log('candidate', event.candidate)
			sendPeerMessage({
				sendUserId: userId,
				signalType: SIGNAL_TYPE_CANDIDATE,
				signalData: event.candidate,
				receiveUserId: member.userId,
			})
		}
	}
peerConnection.ontrack = (event) => {
  console.log('🚨 ontrack 事件触发', event)
  
  const userId = member.userId
  const videoElement = videoRefs.value[userId]
  
  if (!videoElement) {
    console.error(`找不到视频元素 video-${userId}`)
    return
  }

  // 检查是否已有流，避免重复添加
  if (videoElement.srcObject !== event.streams[0]) {
    videoElement.srcObject = event.streams[0]
    console.log(`✅ 为 ${member.nickName} 设置了视频源`)
    
    // 尝试播放视频
    playVideoWithRetry(videoElement, userId)
  }
}
	// 替换原有的 oniceconnectionstatechange 监听器
	peerConnection.onconnectionstatechange = () => {
		console.log('Connection state:', peerConnection.connectionState);

		if (peerConnection.connectionState === 'connected') {
			console.log("✅ P2P 连接已成功建立！");
			// 这里可以执行连接成功后的操作
		}

		// 可选：处理其他状态（如失败/断开）
		if (peerConnection.connectionState === 'failed') {
			console.error("❌ P2P 连接失败");
		}
	};
	// 当本地 ICE 代理的 “候选者收集状态” 发生变化时触发，用于监控候选者的收集进度
	peerConnection.onicegatheringstatechange = (event) => {
		// peerConnectionMap.set(member.userId, peerConnection)
		// 为peerConnection添加音视频轨道
		if (localStream.value) {
			localStream.value.getTracks().forEach(track => {
				peerConnection.addTrack(track, localStream.value)
			})
		}
	}
	peerConnectionMap.set(member?.userId, peerConnection)
	return peerConnection
}
const playVideoWithRetry = (videoElement, userId, attempt = 3) => {
  if (attempt > 5) {
    console.error(`⛔ 播放视频失败超过最大重试次数: ${userId}`)
    return
  }
  
  videoElement.play().catch(e => {
    console.log(`⛔ 播放视频失败: ${e.message}`)
    setTimeout(() => {
      playVideoWithRetry(videoElement, userId, attempt + 1)
    }, 500 * (attempt + 1)) // 指数退避重试
  })
}
// 修改后的sendPeerMessage函数，接收一个包含所有参数的对象
const sendPeerMessage = (params) => {
	// 从传入的params对象中解构需要的参数
	const { sendUserId, receiveUserId, signalType, signalData } = params;
	// 确保signalData被序列化为JSON字符串（主进程可能需要解析）
	// 注意：如果signalData是ICE候选者对象，序列化是必要的
	const formattedData = {
		type: MessageTypeEnum.PEER,
		sendUserId,
		receiveUserId,
		signalType,
		signalData: JSON.stringify(signalData)
	};
	// 发送到主进程的"sendPeerConnection"通道
	window.electron.ipcRenderer.send('sendPeerConnection', formattedData);
};

const sendGeneralMessage = (data) =>{
	window.electron.ipcRenderer.send('onSendGeneralMessage',data)
}
const toggleBubble = () => {v
	isPop.value = !isPop.value
}
const changeLayout = (type) => {
	gridType.value = type
	isPop.value = false
}
const createGroupPeerConnection = async (memberList) => {
	for (const member of memberList) {
		if (member?.userId !== userInfo?.userId) {
			try {
				// 让加入会议的成员与会议中的其他成员建立对等连接
				const peerConnection = createPeerConnection(member, 0, 0, userInfo?.userId)
				updatePeerConnectionTracks(peerConnection,member?.userId)
				// 发送offer请求
				const offer = await peerConnection.createOffer()
				await peerConnection.setLocalDescription(offer)

				sendPeerMessage({
					sendUserId: userInfo?.userId,
					signalType: SIGNAL_TYPE_OFFER,
					signalData: offer,
					receiveUserId: member?.userId,
				})
			} catch (error) {
				console.error('为成员创建 offer 时出错:', error)
			}
		}
	}
}
onMounted(async () => {
	timer = setInterval(() => {
		durationText.value = formatDuration(Date.now() - startAt)
	}, 1000)
	manageMediaTracks()

	const state = await window.shared.get()
	console.log('初始全局状态', state)
	// const userInfo = userStore.getInfo()
	const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {}
	console.log("userInfo", userInfo)
	const { memberList } = state
	console.log("成员列表", memberList)
	curMemberList.value = memberList

	window.electronAPI.onWsMessage(async (message) => {
		// console.log('收到WebSocket消息:', message);

		// 在这里处理消息，例如更新UI、触发业务逻辑等
		// handleMessage(message);
		const msgJson = typeof message == 'object' ? message : JSON.parse(message)
		const { messageType, sendUserId, receiveUserId, messageContent } = msgJson
		console.warn('message type:',messageType)
		switch (messageType) {
			case MessageTypeEnum.ADD_MEETING_ROOM:
				// 新增用户了
				// const {messageContent} = msgJson
				console.log("收到新增用户消息: ",message)
				curMemberList.value = messageContent?.meetingMemberList
				// 新增用户不是自己则与其建立对等连接
				if (messageContent?.newMember?.userId !== userInfo?.userId) {
					try {
						// 让加入会议的成员与会议中的其他成员建立对等连接
						const peerConnection = createPeerConnection(messageContent?.newMember, 0, 0, userInfo?.userId)
						// updatePeerConnectionTracks(peerConnection)
						// 发送offer请求
						// const offer = await peerConnection.createOffer()
						// await peerConnection.setLocalDescription(offer)

						// sendPeerMessage({
						// 	sendUserId: userInfo?.userId,
						// 	signalType: SIGNAL_TYPE_OFFER,
						// 	signalData: offer,
						// 	receiveUserId: messageContent?.newMember.userId,
						// })
					} catch (error) {
						console.error('为成员创建 offer 时出错:', error)
					}
				}
				ElNotification({
					title: '有新的成员加入',
					message: `${messageContent?.newMember?.nickName} 加入会议`
				})
				break
			case MessageTypeEnum.PEER:
				// peer消息
				// 如果是自己发送的，跳过处理
				// console.log('sendUserId', sendUserId, 'userId', userInfo?.userId)
				if (sendUserId == userInfo?.userId) {
					break
				}
				console.log("收到Peer消息",messageContent)
				// const { messageContent } = msgJson
				const peerType = messageContent?.signalType
				const remotePeerConnection = peerConnectionMap.get(sendUserId)
				if (!remotePeerConnection) {
					console.warn('未找到对应的 PeerConnection:', sendUserId)
					break
				}

				switch (peerType) {
					case SIGNAL_TYPE_OFFER:
						try {
							// 确保 signalData 是正确的格式
							const offerData = typeof messageContent?.signalData === 'string' ? JSON.parse(messageContent?.signalData) : messageContent?.signalData
							if (!offerData || !offerData.type || !offerData.sdp) {
								console.error('无效的 offer 数据:', offerData)
								break
							}

							await remotePeerConnection.setRemoteDescription(new RTCSessionDescription(offerData))
							const answer = await remotePeerConnection.createAnswer()
							await remotePeerConnection.setLocalDescription(answer)

							// 发送 answer 响应
							sendPeerMessage({
								sendUserId: userInfo?.userId,
								signalType: SIGNAL_TYPE_ANSWER,
								signalData: answer,
								receiveUserId: sendUserId,
							})
							console.log("answer 已发送")
						} catch (error) {
							console.error('处理 offer 时出错:', error)
						}
						break

					case SIGNAL_TYPE_ANSWER:
						try {
							const answerData = typeof messageContent?.signalData ? JSON.parse(messageContent?.signalData) : messageContent?.signalData
							if (!answerData || !answerData.type || !answerData.sdp) {
								console.error('无效的 answer 数据:', answerData)
								break
							}
							await remotePeerConnection.setRemoteDescription(new RTCSessionDescription(answerData))
						} catch (error) {
							console.error('处理 answer 时出错:', error)
						}
						break

					case SIGNAL_TYPE_CANDIDATE:
						try {
							console.log('ice candidate state', remotePeerConnection.iceConnectionState)
							// 如果远端的candidate是close的状态则直接重新建立连接
							// if (remotePeerConnection.iceConnectionState === 'closed') {
							// 	const peerConnection = createPeerConnection(sendUserId, 0, 0, userInfo?.userId)
							// 	// updatePeerConnectionTracks(peerConnection)
							// 	// 发送offer请求
							// 	const offer = await peerConnection.createOffer()
							// 	await peerConnection.setLocalDescription(offer)

							// 	sendPeerMessage({
							// 		sendUserId: userInfo?.userId,
							// 		signalType: SIGNAL_TYPE_OFFER,
							// 		signalData: offer,
							// 		receiveUserId: sendUserId,
							// 	})
							// 	break
							// }
							const candidateData = typeof messageContent.signalData === 'string' ? JSON.parse(messageContent.signalData) : messageContent.signalData
							if (candidateData && candidateData.candidate) {
								await remotePeerConnection.addIceCandidate(new RTCIceCandidate(candidateData))
							}

						} catch (error) {
							console.error('处理 ICE candidate 时出错:', error)
						}
						break
				}
			case MessageTypeEnum.EXIT_MEETING_ROOM:
				// 有用户退出会议
				// 不知道为什么messageContent的内容是序列化的，因此需要先反序列化
				const exitJson = typeof messageContent === 'string'? JSON.parse(messageContent) : messageContent
				const {exitUserId,meetingMemberDtoList} = exitJson
				curMemberList.value = meetingMemberDtoList
				break
			case MessageTypeEnum.MEETING_USER_VIDEO_CHANGE:
				// 用户的摄像头、语音修改
				console.log("MEETING_USER_VIDEO_CHANGE JSON",messageContent)
				const stateChangeJson = typeof messageContent === 'string'? JSON.parse(messageContent) : messageContent
				console.log(filteredMemberList.value)
				const changeUserItem = filteredMemberList.value.find(item=>item.userId === stateChangeJson?.sendUserId)
				changeUserItem.openVideo = stateChangeJson?.openVideo
				changeUserItem.openMicro = stateChangeJson?.openMicro
				break;
		}
	});
	// 为每个成员创建 PeerConnection
	createGroupPeerConnection(memberList)
	// 创建peerConnection
	// 用户作为新加入的成员，需要与在会议中的所有成员建立peerConnection

})
onBeforeUnmount(() => {
	if (timer) clearInterval(timer)

	// 停止所有媒体轨道
	if (localStream.value) {
		localStream.value.getTracks().forEach(track => track.stop())
	}

	// 关闭所有 peerConnection
	peerConnectionMap.forEach(peerConnection => {
		peerConnection.close()
	})
	  Object.values(videoRefs.value).forEach(video => {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop())
      video.srcObject = null
    }
  })
  videoRefs.value = {}
})

// 网络状态（示意）
const networkQuality = ref('good')
const networkLabel = computed(() => ({ good: '良好', medium: '一般', bad: '较差' }[networkQuality.value] || '未知'))

const micAvailable = true
const avatarInitial = computed(() => (nickName.value || '我').slice(0, 1).toUpperCase())

const toggleMute = async () => {
	microOn.value = !microOn.value
	await manageMediaTracks()
	updateAllPeerConnections()
}

const toggleCamera = async () => {
	cameraOn.value = !cameraOn.value
	// console.log("dataChannelMap",dataChannelMap)
	// for(const [key,val] of dataChannelMap){
	// 	console.log(`${key} dataChannel:`,val)
	const payload = {
		type: MessageTypeEnum.MEETING_USER_VIDEO_CHANGE,
		sendUserId: userInfo?.userId,
		openVideo: cameraOn.value,
		openMicro: microOn.value 
	}
	// 	val.send(JSON.stringify(payload))
	// }
	sendGeneralMessage(payload)
	await manageMediaTracks()
	updateAllPeerConnections()
}


watch(() => filteredMemberList.value, async () => {
  await nextTick()
  
  // 重新为所有需要视频的成员设置流
  peerConnectionMap.forEach((peerConnection, userId) => {
    const videoElement = videoRefs.value[userId]
    if (videoElement && videoElement.srcObject) {
      playVideoWithRetry(videoElement, userId)
    }
  })
}, { deep: true })
const shareScreen = () => {
	ElMessage.info('屏幕共享开发中')
}

const invite = () => { ElMessage.info('邀请功能开发中') }
const toggleMembers = () => { ElMessage.info('成员列表开发中') }
const toggleChat = () => { ElMessage.info('聊天面板开发中') }
const toggleRecord = () => { recording.value = !recording.value }
const endMeeting = () => { window.api?.meetingWindowControl?.('close') }
const controlWindow = async (action) => {
	if (action === 'close') {
		// 退出会议
		const res = await exitMeeting()
		if (res.code != 200) {
			ElMessage.error(res?.message)
			return
		}
	}
	window.api?.meetingWindowControl?.(action)
}
const openSettings = () => { ElMessage.info('设置面板开发中') }
</script>

<style lang="scss" scoped>
.meeting-room {
	position: relative;
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	background: #0f1114;
	color: #fff;
}

.bubble {
	position: absolute;
	top: 100%;
	/* 在布局按钮下方 */
	right: 0;
	width: 120px;
	height: 80px;
	background-color: white;
	padding: 20px;
	z-index: 1;
	color: #0f1114;
	border-radius: 8px;
	justify-content: space-between;
	display: flex;
	margin-top: 10px;
	/* 与按钮的间距 */

	/* 添加向上的三角尖 */
	&::before {
		content: '';
		position: absolute;
		top: -10px;
		/* 三角尖位于气泡上方 */
		right: 20px;
		/* 与布局按钮对齐 */
		width: 0;
		height: 0;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-bottom: 10px solid white;
		/* 与气泡背景色相同 */
	}

	/* 气泡内容样式 */
	div {
		display: flex;
		flex-direction: column;
		align-items: center;

		img {
			width: 50px;
			height: 50px;
		}

		p {
			margin-top: 5px;
			font-size: 12px;
		}
	}
}

.mid-bar {
	position: relative;
	display: flex;
	flex-direction: row;
	width: 100%;

	.layout {
		margin-left: auto;
		display: flex;
		align-items: center;
		margin-right: 20px;
		position: relative;
		/* 为气泡定位提供参考 */

		.layout-region {
			display: flex;
			align-items: center;
			padding: 5px;
			border-radius: 6px;
			cursor: pointer;
			-webkit-app-region: no-drag;
			/* 确保可点击 */

			&:hover {
				background-color: rgba(255, 255, 255, 0.1);
			}

			img {
				width: 20px;
				height: 20px;
				margin-right: 5px;
			}

			p {
				font-size: 12px;
				color: #c9d1d9;
			}
		}
	}
}

.top-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 14px;
	background: rgba(255, 255, 255, 0.04);
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	-webkit-app-region: drag;

	.left {
		width: 250px;

		.title {
			font-size: 14px;
			font-weight: 700;
			color: #fff;
		}

		.sub {
			font-size: 12px;
			color: #c9d1d9;
			opacity: .8;
		}
	}

	// .mid-bar {
	// 	display: flex;
	// 	flex-direction: row;
	// 	width: 100%;

	// 	.layout {
	// 		margin-left: auto;
	// 		display: flex;
	// 		align-items: center;
	// 		margin-right: 20px;
	// 		.layout-region:hover {
	// 			border-radius: 6px;
	// 			background-color: #c9d1d9;
	// 		}
	// 		.layout-region {
	// 			height: 40px;
	// 			-webkit-app-region: no-drag;
	// 			display: flex;
	// 			align-items: center;
	// 		}
	// 		img {
	// 			width: 30px;
	// 			height: 30px;
	// 		}
	// 	}

	// 	.bubble {
	// 		display: flex;
	// 		width: 120px;
	// 		height: 80px;
	// 		background-color: white;
	// 		position: absolute;
	// 		top: 80px;
	// 		right: 80px;
	// 		padding: 20px;
	// 		z-index: 1;
	// 		color: #0f1114;
	// 		border-radius: 8px;
	// 		justify-content: space-between;

	// 		img {
	// 			width: 50px;
	// 			height: 50px;
	// 		}

	// 		p {
	// 			margin-top: 0;
	// 		}
	// 	}
	// }

	.window-controls {
		display: flex;
		gap: 6px;
		-webkit-app-region: no-drag;

		.control-btn {
			width: 22px;
			height: 22px;
			border: none;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.08);
			color: #fff;
			cursor: pointer;
			font-size: 14px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: background-color 0.2s;

			&:hover {
				background: rgba(255, 255, 255, 0.12);
			}

			&.close-btn:hover {
				background: #ff5f56;
				color: #fff;
			}

			&.min-btn:hover {
				background: #ffbd2e;
				color: #fff;
			}

			&.max-btn:hover {
				background: #28c940;
				color: #fff;
			}
		}
	}
}

.meeting-info {
	position: absolute;
	top: 80px;
	left: 20px;
	z-index: 10;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 8px;
	padding: 12px 16px;
	display: flex;
	gap: 20px;

	.info-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;

		.label {
			font-size: 11px;
			color: #c9d1d9;
			opacity: 0.8;
		}

		.value {
			font-size: 13px;
			font-weight: 600;
			color: #fff;

			&.good {
				color: #67c23a;
			}

			&.medium {
				color: #e6a23c;
			}

			&.bad {
				color: #f56c6c;
			}
		}
	}
}

.content {
	flex: 1;
	padding: 10px;
	box-sizing: border-box;
}

.video-area {
	background: rgba(255, 255, 255, 0.02);
	border-radius: 10px;
	padding: 10px;
	height: 100%;

	.grid {
		display: grid;
		gap: 20px;
		height: 100%;

		&.four {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		&.nine {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
}

.video-card {
	position: relative;
	background: #1a1f24;
	border-radius: 10px;
	// min-height: 300px;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	aspect-ratio: 16/9;

	.grid .four & {
		min-height: 300px;
	}

	.grid .nine & {
		min-height: 200px;
	}

	.avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: #2a2f35;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: #e5e7eb;
		font-size: 24px;
	}

	.name-tag {
		position: absolute;
		left: 8px;
		bottom: 8px;
		background: rgba(0, 0, 0, 0.5);
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 12px;
	}
}



.bottom-bar {
	position: sticky;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 10px 14px;
	border-top: 1px solid rgba(255, 255, 255, 0.06);
	background: rgba(255, 255, 255, 0.04);
}

// 布局选项样式
.layout-options {
	padding: 8px 0;

	.layout-title {
		font-size: 14px;
		font-weight: 600;
		color: #333;
		margin-bottom: 12px;
		text-align: center;
	}

	.layout-item {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		cursor: pointer;
		border-radius: 6px;
		transition: background-color 0.2s;

		&:hover {
			background-color: #f5f7fa;
		}

		.layout-icon {
			font-size: 18px;
			margin-right: 8px;
			width: 20px;
			text-align: center;
		}

		.layout-name {
			font-size: 13px;
			color: #333;
		}
	}
}
</style>

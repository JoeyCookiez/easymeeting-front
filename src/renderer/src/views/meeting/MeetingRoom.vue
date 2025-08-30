<template>
	<div class="meeting-room">
		<!-- 顶部标题栏 -->
		<div class="top-bar">
			<div class="left">
				<div class="title">会议 {{ meetingId || '—' }}</div>
				<div class="sub">{{ nickName ? `您以「${nickName}」加入` : '您已加入会议' }}</div>
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
				<div class="grid">
					<div class="video-card self" :class="{ muted: isMuted || !micAvailable, cameraOff: !cameraOn }">
						<div class="avatar" v-if="!cameraOn">{{ avatarInitial }}</div>
						<video v-else autoplay muted playsinline></video>
						<div class="name-tag">{{ nickName || '我' }}</div>
					</div>
					<div class="video-card placeholder" v-for="n in 3" :key="n">
						<div class="avatar">N{{ n }}</div>
						<div class="name-tag">参会者 {{ n }}</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 底部控制栏 -->
		<div class="bottom-bar">
			<div class="controls">
				<el-button :type="isMuted ? 'danger' : 'primary'" @click="toggleMute">{{ isMuted ? '解除静音' : '禁音'
				}}</el-button>
				<el-button :type="cameraOn ? 'primary' : 'warning'" @click="toggleCamera">{{ cameraOn ? '关闭摄像头' : '摄像头'
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '../../stores/UserInfoStore'
const userStore = useUserInfoStore()
const route = useRoute()
const router = useRouter()

const meetingId = computed(() => route.params.meetingId)
const nickName = computed(() => route.query.nickName || '')

const isMuted = ref(false)
const cameraOn = ref(route.query.video === '1')
const localVideo = ref(null)
const recording = ref(false)

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
const SIGNAL_TYPE_OFFER = 'offer'
const SIGNAL_TYPE_ANSWER = 'answer'
const SIGNAL_TYPE_CANDIDATE = 'candidate'

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
		console.log('ontrack', event)
		// 通过document.selectById获取dom然后通过.srcObject显示视频
	}
	peerConnection.oniceconnectionstatechange = (event) => {
		console.log('oniceconnectionstatechange', event)
		if (peerConnection.connectionState === 'connected') {
			console.log("p2p 连接已建立！")
		}
	}
	// 当本地 ICE 代理的 “候选者收集状态” 发生变化时触发，用于监控候选者的收集进度
	peerConnection.onicegatheringstatechange = (event) => {
		peerConnectionMap.set(member.userId, peerConnection)
		// 为peerConnection添加音视频轨道
		localStream.getTracks().forEach(track => {
			peerConnection.addTrack(track, localStream)
		})
	}
	peerConnectionMap.set(member?.userId, peerConnection)
	return peerConnection
}
// 修改后的sendPeerMessage函数，接收一个包含所有参数的对象
const sendPeerMessage = (params) => {
	// 从传入的params对象中解构需要的参数
	const { sendUserId, receiveUserId, signalType, signalData } = params;
	// 确保signalData被序列化为JSON字符串（主进程可能需要解析）
	// 注意：如果signalData是ICE候选者对象，序列化是必要的
	const formattedData = {
		sendUserId,
		receiveUserId,
		signalType,
		signalData: JSON.stringify(signalData)
	};
	// 发送到主进程的"sendPeerConnection"通道
	window.electron.ipcRenderer.send('sendPeerConnection', formattedData);
};


onMounted(async () => {
	timer = setInterval(() => {
		durationText.value = formatDuration(Date.now() - startAt)
	}, 1000)
	const state = await window.shared.get()
	console.log('初始全局状态', state)
	// const userInfo = userStore.getInfo()
	const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {}
	console.log("userInfo", userInfo)
	const { memberList } = state
	window.electronAPI.onWsMessage(async (message) => {
		console.log('收到WebSocket消息:', message);
		// 在这里处理消息，例如更新UI、触发业务逻辑等
		// handleMessage(message);
		const msgJson = typeof message == 'object' ? message : JSON.parse(message)
		const { messageType, sendUserId, receiveUserId } = msgJson
		switch (messageType) {
			case 2:
				// peer消息
				// 如果是自己发送的，跳过处理
				console.log('sendUserId', sendUserId, 'userId', userInfo?.userId)
				if (sendUserId == userInfo?.userId) {
					break
				}

				const { messageContent } = msgJson
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
							const candidateData = messageContent?.signalData
							if (candidateData && candidateData.candidate) {
								await remotePeerConnection.addIceCandidate(new RTCIceCandidate(candidateData))
							}
						} catch (error) {
							console.error('处理 ICE candidate 时出错:', error)
						}
						break
				}
		}
	});
	// 开启本地音视频显示
	// navigator.mediaDevices.getUserMedia({
	// 	video: true,
	// 	audio: true
	// }).then(stream => {
	// 	localVideo.value.srcObject = stream
	// })
	// 为每个成员创建 PeerConnection
	for (const member of memberList) {
		if (member?.userId !== userInfo?.userId) {
			try {
				// 让加入会议的成员与会议中的其他成员建立对等连接
				const peerConnection = createPeerConnection(member, 0, 0, userInfo?.userId)
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
	// 创建peerConnection
	// 用户作为新加入的成员，需要与在会议中的所有成员建立peerConnection

})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

// 网络状态（示意）
const networkQuality = ref('good')
const networkLabel = computed(() => ({ good: '良好', medium: '一般', bad: '较差' }[networkQuality.value] || '未知'))

const micAvailable = true
const avatarInitial = computed(() => (nickName.value || '我').slice(0, 1).toUpperCase())

const toggleMute = () => {
	isMuted.value = !isMuted.value
}

const toggleCamera = () => {
	cameraOn.value = !cameraOn.value
}



const shareScreen = () => {
	ElMessage.info('屏幕共享开发中')
}

const invite = () => { ElMessage.info('邀请功能开发中') }
const toggleMembers = () => { ElMessage.info('成员列表开发中') }
const toggleChat = () => { ElMessage.info('聊天面板开发中') }
const toggleRecord = () => { recording.value = !recording.value }
const endMeeting = () => { window.api?.meetingWindowControl?.('close') }
const controlWindow = (action) => { window.api?.meetingWindowControl?.(action) }
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

.top-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 14px;
	background: rgba(255, 255, 255, 0.04);
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	-webkit-app-region: drag;

	.left {
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
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px;
		height: 100%;
	}
}

.video-card {
	position: relative;
	background: #1a1f24;
	border-radius: 10px;
	min-height: 300px;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;

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
</style>

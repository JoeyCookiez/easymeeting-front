<template>
	<div class="meeting-room">
		<!-- 顶部标题栏 -->
		<div class="top-bar">
			<div class="left">
				<div class="title">会议 {{ meetingNo || '—' }}</div>
				<div class="sub">{{ nickName ? `您以「${nickName}」加入` : '您已加入会议' }}</div>
			</div>
			<div class="mid-bar">
				<div class="layout">
					<span class="layout-region" @click="toggleBubble">
						<img :src="layout_fill" style="width: 22px; height: 22px;"></img>
						<p>布局</p>
					</span>
				</div>
				<div v-if="isPop" class="bubble">
					<div @click="changeLayout('four')">
						<img src="../../assets/icons/four_grid.svg"></img>
						<p>四宫格</p>
					</div>
					<div @click="changeLayout('nine')">
						<img src="../../assets/icons/nine_grid.svg"></img>
						<p>九宫格</p>
					</div>
				</div>
			</div>
			<div class="right window-controls">
				<button class="control-btn min-btn" title="最小化" @click="controlWindow('minimize')">─</button>
				<button class="control-btn max-btn" title="最大化/还原" @click="controlWindow('maximize')">⬜</button>
				<button class="control-btn close-btn" title="关闭" @click="toggleExitBubble(0)">×</button>
			</div>
			<div v-if="isExitTop" class="top-exit-bubble">
				<el-button type="danger" v-if="meetingInfo?.createUserId === userInfo?.userId"
					@click="handleFinishMeeting">结束会议</el-button>
				<el-button @click="controlWindow('close')">离开会议</el-button>
			</div>
		</div>


		<!-- 主体：视频网格 -->
		<div class="mid-container">
			<div class="left-panel">
				<div class="content" @click="cancelExit" :ref="setContentRef">
					<div v-if="recording" class="recording-timer">{{ recordTimerText }}</div>
					<div class="video-area">
						<!-- 左侧切换按钮 -->
						<button v-if="totalPages > 1 && currentPage > 1" class="pagination-btn pagination-btn-left"
							@click="goToPreviousPage" title="上一页">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
							</svg>
						</button>

						<!-- 右侧切换按钮 -->
						<button v-if="totalPages > 1 && currentPage < totalPages"
							class="pagination-btn pagination-btn-right" @click="goToNextPage" title="下一页">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
							</svg>
						</button>

						<div class="grid" :class="gridType">
							<div class="video-card" v-for="(member, index) in currentPageMembers"
								:key="member?.userId || 'self'" :class="{
									self: member?.userId === userInfo?.userId,
									muted: member?.userId === userInfo?.userId && (isMuted || !micAvailable),
									cameraOff: member?.userId === userInfo?.userId && !cameraOn
								}">
								<div class="avatar"
									v-if="member?.userId === userInfo?.userId ? !cameraOn : !member?.openVideo">
									{{ member?.userId === userInfo?.userId ? avatarInitial : member?.nickName?.slice(0,
										1).toUpperCase() }}
								</div>
								<video v-if="member?.userId === userInfo?.userId && cameraOn" autoplay muted playsinline
									:ref="setLocalVideo"></video>
								<video v-else-if="member?.userId !== userInfo?.userId && member?.openVideo" autoplay
									playsinline :ref="el => setVideoRef(el, member?.userId)"
									@loadedmetadata="handleVideoLoaded($event, member?.userId)"></video>
								<div class="name-tag">
									{{ member?.userId === userInfo?.userId ? (nickName || '我') : member?.nickName }}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- 分页指示器 -->
				<div v-if="totalPages > 1" class="pagination-indicator">
					<div class="pagination-dots">
						<span v-for="page in totalPages" :key="page" class="pagination-dot"
							:class="{ active: page === currentPage }" @click="goToPage(page)">
						</span>
					</div>
				</div>

				<!-- 底部控制栏 -->
				<div class="bottom-bar">
					<div class="comments">
						<div class="comment-input-area">
							<img :src="face_line" width="20" height="20" />
							<input v-model="commentInput" class="comment-input" placeholder="说点什么..." />
						</div>
					</div>

					<div class="controls">
						<IconWithTitle :svgSrc="microOn ? mic_on : mic_off" :title="microOn ? '禁音' : '解除禁音'"
							@click="toggleMute">
						</IconWithTitle>
						<IconWithTitle :svgSrc="cameraOn ? video_on : video_off" :title="cameraOn ? '停止视频' : '开启视频'"
							@click="toggleCamera"></IconWithTitle>
						<IconWithTitle :svgSrc="screen_share" title="共享屏幕" :iconSize="24" @click="shareScreen">
						</IconWithTitle>
						<IconWithTitle :svgSrc="invite_on" title="邀请" :iconSize="24" @click="invite"></IconWithTitle>
						<IconWithTitle :svgSrc="member_on" :title="`成员(${allMembersList.length})`" :iconSize="24" @click="toggleMembers">
						</IconWithTitle>
						<IconWithTitle :svgSrc="chat_on" title="聊天" @click="toggleChat"></IconWithTitle>
						<IconWithTitle :svgSrc="recording ? record_on : record_off" :title="recording ? '停止录制' : '录制'"
							@click="toggleRecord">

						</IconWithTitle>
						<!-- <el-button @click="toggleRecord">{{ recording ? '停止录制' : '录制' }}</el-button> -->
					</div>
					<div class="actions">

						<IconWithTitle v-if="!isClickExit" @click="toggleExitBubble(1)" :svgSrc="exit_meeting_on"
							:title="meetingInfo?.createUserId === userInfo?.userId ? '结束会议' : '离开会议'" />
						<!-- <el-button v-else @click="cancelExit">取消</el-button> -->
						<div v-else class="cancel-area" @click="cancelExit">取消</div>
						<div v-if="isExitBottom" class="bottom-exit-bubble">
							<el-button type="danger" v-if="meetingInfo?.createUserId === userInfo?.userId"
								@click="handleFinishMeeting">结束会议</el-button>
							<el-button @click="controlWindow('close')">离开会议</el-button>
						</div>
					</div>
				</div>
			</div>
			<div class="right-panel">
				<CHatRoom v-if="rightPanelSelect === 0" />
				<MemberList :memberList="allMembersList" v-if="rightPanelSelect === 1" />
			</div>
		</div>
		<!-- 屏幕共享选择弹窗 -->
		<ScreenShareDialog :visible="showScreenShareDialog" @close="closeScreenShareDialog" @share="startScreenShare" />
	</div>

</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { useUserInfoStore } from '../../stores/UserInfoStore'
import { exitMeeting } from '../../api/meeting'
import { MessageTypeEnum } from '../../enums/messageTypeEnum'
import ScreenShareDialog from '../../components/ScreenShareDialog.vue'
import IconWithTitle from '../../components/IconWithTitle.vue'
import mic_off from '../../assets/icons/mic_off.svg'
import mic_on from '../../assets/icons/mic_on.svg'
import video_off from '../../assets/icons/video_icon_off.svg'
import video_on from '../../assets/icons/video_icon_on.svg'
import screen_share from '../../assets/icons/screen_share.svg'
import invite_on from '../../assets/icons/invite_normal.svg'
import member_on from '../../assets/icons/member_normal.svg'
import chat_on from '../../assets/icons/chat_normal.svg'
import record_off from '../../assets/icons/record_off.svg'
import record_on from '../../assets/icons/record_on.svg'
import exit_meeting_on from '../../assets/icons/exit_meeting.svg'
import face_line from '../../assets/icons/face_line.svg'
import layout_fill from '../../assets/icons/layout_on.svg'
import { getMeetingInfo, saveInMeeting, saveMeetingMessageList } from '../../utils/presist'
import CHatRoom from '../../components/CHatRoom.vue'
import MemberList from '../../components/MemberList.vue'
const userStore = useUserInfoStore()
const route = useRoute()
const router = useRouter()
const commentInput = ref('') // 弹幕输入框的内容
const meetingInfo = ref({
	createUserId: "277350997476"
})
const curMemberList = ref([])
const meetingNo = computed(() => route.params.meetingNo)
const nickName = computed(() => route.query.nickName || '')
const localStream = ref(null)
const isMuted = ref(route.query.micro !== '1')
const cameraOn = ref(route.query.video === '1')
const microOn = ref(route.query.micro === '1')
const localVideo = ref(null)
const recording = ref(false)
const recordTimerText = ref('00:00')
let recordTimer = null
const contentRef = ref(null)
const setContentRef = (el)=>{ contentRef.value = el }
let mediaRecorder = null
let recordedChunks = []
let mixAudioStream = null
let composedStream = null
let audioContext = null
let destinationNode = null
const isPop = ref(false)
const gridType = ref('four')
const showScreenShareDialog = ref(false)
const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {}

// 分页相关变量
const currentPage = ref(1)
const pageSize = computed(() => gridType.value === 'four' ? 4 : 9)
const totalPages = computed(() => {
	const totalMembers = filteredMemberList.value.length + 1 // +1 包含自己
	return Math.min(Math.ceil(totalMembers / pageSize.value), 3) // 最多显示3页
})
const allMembersList = computed(()=>[{ ...userInfo, userId: userInfo?.userId }, ...filteredMemberList.value])
const currentPageMembers = computed(() => {
	const startIndex = (currentPage.value - 1) * pageSize.value
	const endIndex = startIndex + pageSize.value
	const allMembers = [{ ...userInfo, userId: userInfo?.userId }, ...filteredMemberList.value] // 包含自己
	return allMembers.slice(startIndex, endIndex)
})
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
const sharing = ref(false)
const peerConnectionMap = new Map()
const dataChannelMap = new Map()
const SIGNAL_TYPE_OFFER = 'offer'
const SIGNAL_TYPE_ANSWER = 'answer'
const SIGNAL_TYPE_CANDIDATE = 'candidate'
const isClickExit = ref(false) // 是否点击了离开会议的按钮，如果点击了就让按钮变成取消
const videoRefs = ref({})
const isShowChat = ref(false)
const setVideoRef = (el, userId) => {
	if (el) {
		videoRefs.value[userId] = el
		el.oncanplay = () => {
			el.play().catch(e => console.log("播放失败:", e))
		}
	} else {
		// 当元素被移除时，清理相关资源
		if (videoRefs.value[userId]) {
			const video = videoRefs.value[userId]
			if (video && video.srcObject) {
				video.srcObject.getTracks().forEach(track => track.stop())
				video.srcObject = null
			}
			delete videoRefs.value[userId]
		}
	}
}
const isExitTop = ref(false) // 是否是上方弹窗
const isExitBottom = ref(false) // 是否是下方弹窗
const rightPanelSelect = ref(0) // 右侧面板显示什么 0表示显示聊天室 1表示显示成员列表
// 在 script 部分
const filteredMemberList = computed(() => {
	return curMemberList.value.length > 1 ? curMemberList.value.filter(member => member.userId !== userInfo?.userId) : [];
});
const setLocalVideo = el=>{
	localVideo.value = el
}
const attachLocal = () => {
  if (localVideo.value && localStream.value) {
    localVideo.value.srcObject = localStream.value
    localVideo.value.onloadedmetadata = () => localVideo.value.play().catch(console.error)
  }
}
const handleVideoLoaded = (event, userId) => {
	const video = event.target
	// 检查视频元素是否仍然存在于DOM中
	if (document.contains(video)) {
		playVideoWithRetry(video, userId)
	}
}
// 结束会议逻辑
const handleFinishMeeting = () => {

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

			console.log(`🎥 获取媒体流，约束条件:`, constraints)
			localStream.value = await navigator.mediaDevices.getUserMedia(constraints)
			attachLocal()
			// 如果本地dom节点存在则在本地显示
			if (localVideo.value) {
				localVideo.value.srcObject = localStream.value
				console.log("📹 本地视频流已更新，轨道数量:", localStream.value.getTracks().length)
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
const isMakingOfferMap = new Map()
const politeRoleMap = new Map()

const waitForStable = async (pc) => {
	if (pc.signalingState === 'stable') return
	await new Promise((resolve) => {
		const handler = () => {
			if (pc.signalingState === 'stable') {
				pc.removeEventListener('signalingstatechange', handler)
				resolve()
			}
		}
		pc.addEventListener('signalingstatechange', handler)
	})
}

const ensurePoliteRole = (remoteUserId) => {
	if (politeRoleMap.has(remoteUserId)) return politeRoleMap.get(remoteUserId)
	const self = String(userInfo?.userId || '')
	const remote = String(remoteUserId || '')
	const polite = self > remote
	politeRoleMap.set(remoteUserId, polite)
	return polite
}

const safeRenegotiate = async (peerConnection, remoteUserId) => {
	const polite = ensurePoliteRole(remoteUserId)
	if (isMakingOfferMap.get(remoteUserId)) return
	isMakingOfferMap.set(remoteUserId, true)
	try {
		await waitForStable(peerConnection)
		const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
		await peerConnection.setLocalDescription(offer)
		sendPeerMessage({
			sendUserId: userInfo?.userId,
			signalType: SIGNAL_TYPE_OFFER,
			signalData: offer,
			receiveUserId: remoteUserId
		})
		console.log(`✅ 向用户 ${remoteUserId} 发送了安全的重新协商OFFER（polite=${polite}）`)
	} catch (error) {
		console.error(`安全重新协商时出错（remote=${remoteUserId}）:`, error)
	} finally {
		isMakingOfferMap.set(remoteUserId, false)
	}
}

const updatePeerConnectionTracks = async (peerConnection, userId) => {
	const senders = peerConnection.getSenders()
	if (localStream.value) {
		const tracks = localStream.value.getTracks()
		tracks.forEach(track => {
			const sender = senders.find(s => s.track && s.track.kind === track.kind)
			if (sender) {
				sender.replaceTrack(track)
			} else {
				peerConnection.addTrack(track, localStream.value)
			}
		})
	} else {
		senders.forEach(sender => {
			if (sender.track) sender.replaceTrack(null)
		})
	}

	await safeRenegotiate(peerConnection, userId)
}
const updateAllPeerConnections = async () => {
	const updatePromises = []

	peerConnectionMap.forEach((peerConnection, userId) => {
		console.log(`🔄 更新PeerConnection for userId: ${userId}, connectionState: ${peerConnection.connectionState}`)
		updatePromises.push(updatePeerConnectionTracks(peerConnection, userId))
	})

	try {
		await Promise.all(updatePromises)
		console.log(`✅ 所有PeerConnection更新完成，共处理 ${updatePromises.length} 个连接`)
	} catch (error) {
		console.error('❌ 更新PeerConnection时发生错误:', error)
	}
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
	console.warn(`为${member?.userId} 创建PeerConnection`)
	// 如果存在视频音频流则为这个PeerConnection添加轨道
	if (localStream.value) {
		console.log("存在视频音频轨道", localStream.value)
		localStream.value.getTracks().forEach(track => {
			peerConnection.addTrack(track, localStream.value)
		})
	}

	if (!cameraEnable) {
		peerConnection.addTransceiver('video', { direction: 'recvonly' })
	}
	if (!micEnable) {
		peerConnection.addTransceiver('audio', { direction: 'recvonly' })
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
		if (event.streams.length === 0) {
			// 如果track为空则直接不处理
			return
		}
		const userId = member.userId
		const videoElement = videoRefs.value[userId]

		if (!videoElement) {
			console.error(`找不到视频元素 video-${userId}`)
			return
		}

		// 检查视频元素是否仍然存在于DOM中
		if (!document.contains(videoElement)) {
			console.warn(`视频元素已从DOM中移除: ${userId}`)
			return
		}


		// 检查是否已有流，避免重复添加
		if (videoElement.srcObject !== event.streams[0]) {
			// 先停止之前的流
			if (videoElement.srcObject) {
				videoElement.srcObject.getTracks().forEach(track => track.stop())
			}
			console.log("设置视频源之前检查 视频dom", videoElement, "视频流", event.streams)
			videoElement.srcObject = event.streams[0]
			console.log(`✅ 为 ${member.nickName} 设置了视频源`)

			// 尝试播放视频
			// playVideoWithRetry(videoElement, userId)
			setTimeout(() => {
				videoElement.play().catch(e => {
					console.error("视频播放失败", e)
				})
			}, 300)
		}
	}
	// 替换原有的 oniceconnectionstatechange 监听器
	peerConnection.onconnectionstatechange = async () => {
		console.log('Connection state:', peerConnection.connectionState);

		if (peerConnection.connectionState === 'connected') {
			console.log("✅ P2P 连接已成功建立！");
			// 这里可以执行连接成功后的操作
			const videoEl = videoRefs.value[member.userId]
			if (videoEl) {
				videoEl.play().catch(console.error)
			}
		}

		// 可选：处理其他状态（如失败/断开）
		if (peerConnection.connectionState === 'failed') {
			console.error("❌ P2P 连接失败");
			peerConnection.restartIce()
		}
	};
	// 当本地 ICE 代理的 "候选者收集状态" 发生变化时触发，用于监控候选者的收集进度
	peerConnection.onicegatheringstatechange = (event) => {
		// 注意：这里不需要重复添加轨道，因为已经在创建时添加了
		console.log(`ICE gathering state changed for ${member.userId}:`, peerConnection.iceGatheringState)
	}
	peerConnectionMap.set(member?.userId, peerConnection)
	return peerConnection
}
const playVideoWithRetry = (videoElement, userId, attempt = 1) => {
	// 检查视频元素是否仍然存在于DOM中
	if (!document.contains(videoElement)) {
		console.warn(`视频元素已从DOM中移除，停止播放重试: ${userId}`)
		return
	}

	if (attempt > 5) {
		console.error(`⛔ 播放视频失败超过最大重试次数: ${userId}`)
		return
	}

	// 检查视频元素是否准备好播放
	if (videoElement.readyState < 2) { // HAVE_CURRENT_DATA
		console.log(`视频元素未准备好播放，等待...: ${userId}`)
		setTimeout(() => {
			playVideoWithRetry(videoElement, userId, attempt)
		}, 100)
		return
	}

	videoElement.play().catch(e => {
		console.log(`⛔ 播放视频失败 (尝试 ${attempt}/5): ${e.message}`)

		// 如果是DOM移除错误，停止重试
		if (e.message.includes('removed from the document')) {
			console.warn(`视频元素已从DOM中移除，停止重试: ${userId}`)
			return
		}

		// 其他错误继续重试
		setTimeout(() => {
			playVideoWithRetry(videoElement, userId, attempt + 1)
		}, 500 * attempt) // 指数退避重试
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

const sendGeneralMessage = (data) => {
	window.electron.ipcRenderer.send('onSendGeneralMessage', data)
}
const toggleBubble = () => {
	isPop.value = !isPop.value
}
// 控制上下方退出会议弹窗的函数
// param : pos : 0 , 1
// 0 表示是top 1 表示是 bottom
const toggleExitBubble = (pos) => {
	if (pos) {
		// 1的情况，下方弹窗
		isExitBottom.value = true
		isClickExit.value = true
	} else {
		isExitTop.value = true
	}
}
const cancelExit = () => {
	isClickExit.value = false
	isExitBottom.value = false
	isExitTop.value = false
}
const changeLayout = (type) => {
	gridType.value = type
	isPop.value = false
	// 切换布局时重置到第一页
	currentPage.value = 1
}

// 分页切换函数
const goToPage = (page) => {
	if (page >= 1 && page <= totalPages.value) {
		currentPage.value = page
	}
}

const goToPreviousPage = () => {
	if (currentPage.value > 1) {
		currentPage.value--
	}
}

const goToNextPage = () => {
	if (currentPage.value < totalPages.value) {
		currentPage.value++
	}
}
const createGroupPeerConnection = async (memberList) => {
	for (const member of memberList) {
		if (member?.userId !== userInfo?.userId) {
			try {
				// 让加入会议的成员与会议中的其他成员建立对等连接
				const peerConnection = createPeerConnection(member, 0, 0, userInfo?.userId)

				// 确保本地媒体轨道已添加到新的peerConnection
				updatePeerConnectionTracks(peerConnection, member?.userId)

				// 发送offer请求
				// const offer = await peerConnection.createOffer()
				// await peerConnection.setLocalDescription(offer)

				// sendPeerMessage({
				// 	sendUserId: userInfo?.userId,
				// 	signalType: SIGNAL_TYPE_OFFER,
				// 	signalData: offer,
				// 	receiveUserId: member?.userId,
				// })
				// console.log(`✅ 已向新用户 ${member?.nickName} 发送offer`)
			} catch (error) {
				console.error('为成员创建 offer 时出错:', error)
			}
		}
	}
}

// 新用户加入后，主动向现有用户请求视频流
const requestExistingUserStreams = async (newUserId) => {
	console.log(`🔄 新用户 ${newUserId} 主动请求现有用户的视频流`)

	// 遍历现有成员，向开启视频的用户请求流
	curMemberList.value.forEach(async (member) => {
		if (member.userId !== userInfo?.userId && member.userId !== newUserId && member.openVideo) {
			try {
				console.log(`📹 向用户 ${member.nickName} 请求视频流`)

				// 创建到该用户的连接
				const peerConnection = createPeerConnection(member, 0, 0, userInfo?.userId)

				// 确保本地媒体轨道已添加
				updatePeerConnectionTracks(peerConnection, member.userId)

				// 发送offer请求
				const offer = await peerConnection.createOffer({
					offerToReceiveAudio: true,
					offerToReceiveVideo: true
				})
				await peerConnection.setLocalDescription(offer)

				sendPeerMessage({
					sendUserId: userInfo?.userId,
					signalType: SIGNAL_TYPE_OFFER,
					signalData: offer,
					receiveUserId: member.userId,
				})

				console.log(`✅ 已向用户 ${member.nickName} 发送offer请求`)
			} catch (error) {
				console.error(`向用户 ${member.nickName} 请求视频流时出错:`, error)
			}
		}
	})
}

onMounted(async () => {
	timer = setInterval(() => {
		durationText.value = formatDuration(Date.now() - startAt)
	}, 1000)
	manageMediaTracks()
	saveInMeeting(true)
	const state = await window.shared.get()
	// console.log('初始全局状态', state)
	// const userInfo = userStore.getInfo()
	const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {}
	// console.log("userInfo", userInfo)
	const { memberList } = state
	console.log("state", state)
	curMemberList.value = memberList
	meetingInfo.value = getMeetingInfo()
	// 监听tipbar的动作
	window.electron.ipcRenderer.on('tipbar-action', async (event, data) => {
		console.log('收到tipbar动作:', data)
		switch (data.action) {
			case 'stop-sharing':
				await stopScreenShare()
				break
			case 'toggle-mute':
				isMuted.value = data.isMuted
				await manageMediaTracks()
				await updateAllPeerConnections()
				break
			case 'toggle-camera':
				cameraOn.value = data.cameraOn
				await manageMediaTracks()
				await updateAllPeerConnections()
				break
			case 'toggle-members':
				toggleMembers()
				break
			case 'toggle-chat':
				toggleChat()
				break
			case 'toggle-record':
				recording.value = data.recording
				toggleRecord()
				break
			case 'share-screen':
				shareScreen()
				break
			case 'end-meeting':
				endMeeting()
				break
		}
	})
	await window.electronAPI.sendTunnelMessage({
		winKey: "main",
		data: {
			inMeeting: true
		}
	})
	// 监听保存会议消息的IPC事件
	window.electron.ipcRenderer.on('save-meeting-message', (event, messageContent) => {
		console.log('收到保存会议消息请求:', messageContent)
		saveMeetingMessageList(messageContent)
	})

	window.electronAPI.onWsMessage(async (message) => {
		// console.log('收到WebSocket消息:', message);

		// 在这里处理消息，例如更新UI、触发业务逻辑等
		// handleMessage(message);
		const msgJson = typeof message == 'object' ? message : JSON.parse(message)
		const { messageType, sendUserId, receiveUserId, messageContent } = msgJson
		console.warn('message type:', messageType)
		switch (messageType) {
			case MessageTypeEnum.ADD_MEETING_ROOM:
				// 新增用户了
				// const {messageContent} = msgJson
				console.log("收到新增用户消息: ", message)
				curMemberList.value = messageContent?.meetingMemberList
				// 新增用户不是自己则与其建立对等连接
				if (messageContent?.newMember?.userId !== userInfo?.userId) {
					try {
						console.log(`🔄 为新加入的用户 ${messageContent?.newMember?.nickName} 建立连接`)

						// 让加入会议的成员与会议中的其他成员建立对等连接
						const peerConnection = createPeerConnection(messageContent?.newMember, 0, 0, userInfo?.userId)

						// 确保本地媒体轨道已添加到新的peerConnection
						updatePeerConnectionTracks(peerConnection, messageContent?.newMember?.userId)

						// 发送offer请求
						// const offer = await peerConnection.createOffer()
						// await peerConnection.setLocalDescription(offer)

						// sendPeerMessage({
						// 	sendUserId: userInfo?.userId,
						// 	signalType: SIGNAL_TYPE_OFFER,
						// 	signalData: offer,
						// 	receiveUserId: messageContent?.newMember.userId,
						// })

						console.log(`✅ 已向新用户 ${messageContent?.newMember?.nickName} 发送offer`)
					} catch (error) {
						console.error('为成员创建 offer 时出错:', error)
					}
				}
				ElNotification({
					title: '有新的成员加入',
					message: `${messageContent?.newMember?.nickName} 加入会议`
				})

				// 新用户加入后，主动请求现有用户的视频流
				requestExistingUserStreams(messageContent?.newMember?.userId)
				break
			case MessageTypeEnum.PEER:
				// peer消息
				// 如果是自己发送的，跳过处理
				// console.log('sendUserId', sendUserId, 'userId', userInfo?.userId)
				if (sendUserId == userInfo?.userId) {
					break
				}
				console.log("收到Peer消息", messageContent)
				// const { messageContent } = msgJson
				const peerType = messageContent?.signalType
				let remotePeerConnection = peerConnectionMap.get(sendUserId)
				if (!remotePeerConnection) {
					console.warn('未找到对应的 PeerConnection:', sendUserId)
					break
					// remotePeerConnection = createPeerConnection({userId:sendUserId,nickName})
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

							// 处理 glare：如果本端也在发起或当前非 stable
							const collision = isMakingOfferMap.get(sendUserId) || remotePeerConnection.signalingState !== 'stable'
							const polite = ensurePoliteRole(sendUserId)
							if (collision) {
								if (!polite) {
									console.warn('检测到协商冲突（glare），非礼貌端忽略此次 offer')
									break
								} else {
									// 礼貌端回滚本地描述后再应用远端
									if (remotePeerConnection.signalingState !== 'stable') {
										await remotePeerConnection.setLocalDescription({ type: 'rollback' })
									}
								}
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
							const answerData = typeof messageContent?.signalData === 'string' ? JSON.parse(messageContent?.signalData) : messageContent?.signalData
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
				const exitJson = typeof messageContent === 'string' ? JSON.parse(messageContent) : messageContent
				const { exitUserId, meetingMemberDtoList } = exitJson
				curMemberList.value = meetingMemberDtoList
				break
			case MessageTypeEnum.MEETING_USER_VIDEO_CHANGE:
				// 用户的摄像头、语音修改
				// console.log("MEETING_USER_VIDEO_CHANGE JSON", messageContent)
				const stateChangeJson = typeof messageContent === 'string' ? JSON.parse(messageContent) : messageContent
				// console.log(filteredMemberList.value)
				const changeUserItem = filteredMemberList.value.find(item => item.userId === stateChangeJson?.sendUserId)
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
	if (recordTimer) clearInterval(recordTimer)

	// 停止所有媒体轨道
	if (localStream.value) {
		localStream.value.getTracks().forEach(track => track.stop())
		localStream.value = null
	}

	// 关闭所有 peerConnection
	peerConnectionMap.forEach(peerConnection => {
		peerConnection.close()
	})
	peerConnectionMap.clear()

	// 清理所有视频引用和流
	Object.values(videoRefs.value).forEach(video => {
		if (video && video.srcObject) {
			video.srcObject.getTracks().forEach(track => track.stop())
			video.srcObject = null
		}
	})
	videoRefs.value = {}

	// 清理数据通道
	Object.values(dataChannelMap).forEach(channel => {
		if (channel && channel.readyState === 'open') {
			channel.close()
		}
	})

	// 清理tipbar监听器
	window.electron.ipcRenderer.removeAllListeners('tipbar-action')

	// 清理保存会议消息监听器
	window.electron.ipcRenderer.removeAllListeners('save-meeting-message')

	// 关闭tipbar窗口
	window.api.closeScreenShareTipbar()
})

// 网络状态（示意）
const networkQuality = ref('good')
const networkLabel = computed(() => ({ good: '良好', medium: '一般', bad: '较差' }[networkQuality.value] || '未知'))

const micAvailable = true
const avatarInitial = computed(() => (nickName.value || '我').slice(0, 1).toUpperCase())

const toggleMute = async () => {
	microOn.value = !microOn.value
	isMuted.value = !microOn.value
	await manageMediaTracks()
	await updateAllPeerConnections()

	// 更新tipbar状态
	if (sharing.value) {
		await window.api.updateTipbarState({
			isMuted: isMuted.value
		})
	}
}

const toggleCamera = async () => {
	cameraOn.value = !cameraOn.value
	console.log(`🎥 摄像头状态切换为: ${cameraOn.value ? '开启' : '关闭'}`)

	const payload = {
		type: MessageTypeEnum.MEETING_USER_VIDEO_CHANGE,
		sendUserId: userInfo?.userId,
		openVideo: cameraOn.value,
		openMicro: microOn.value,
		time: '-'
	}
	sendGeneralMessage(payload)

	// 先更新本地媒体流
	await manageMediaTracks()

	// 然后更新所有PeerConnection并触发重新协商
	console.log(`🔄 开始更新所有PeerConnection，当前连接数: ${peerConnectionMap.size}`)
	// await updateAllPeerConnections()
	if(allMembersList.value.length>1){
		await updateAllPeerConnections()
	}

	// 更新tipbar状态
	if (sharing.value) {
		await window.api.updateTipbarState({
			cameraOn: cameraOn.value
		})
	}
}

// 录制：收集视频与混音后的音频
const buildMixedAudioStream = () => {
	if (audioContext) {
		try { audioContext.close() } catch {}
	}
	audioContext = new (window.AudioContext || window.webkitAudioContext)()
	destinationNode = audioContext.createMediaStreamDestination()

	// 本地音频
	if (localStream.value) {
		const localAudioTracks = localStream.value.getAudioTracks()
		if (localAudioTracks.length) {
			const localSource = audioContext.createMediaStreamSource(new MediaStream([localAudioTracks[0]]))
			localSource.connect(destinationNode)
		}
	}
	// 远端音频：从每个 video 元素的 srcObject 中提取音轨
	Object.values(videoRefs.value).forEach((video)=>{
		if (!video || !video.srcObject) return
		const s = video.srcObject
		const tracks = s.getAudioTracks()
		if (tracks && tracks.length) {
			const source = audioContext.createMediaStreamSource(new MediaStream([tracks[0]]))
			source.connect(destinationNode)
		}
	})

	mixAudioStream = destinationNode.stream
	return mixAudioStream
}

const captureContentVideo = async () => {
    const container = contentRef.value
    if (!container) throw new Error('未找到内容区域')

    // 方案A：如果浏览器支持 Region Capture，对窗口媒体进行裁剪
    try {
        if (navigator.mediaDevices.getDisplayMedia) {
            const disp = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 30 },
                audio: false
            })
            const track = disp.getVideoTracks()[0]
            if (track && window.CropTarget && typeof track.cropTo === 'function') {
                const target = await window.CropTarget.fromElement(container)
                await track.cropTo(target)
                return new MediaStream([track])
            } else {
                // 不支持裁剪则停止该轨并继续使用方案B
                track && track.stop()
            }
        }
    } catch (e) {
        console.warn('Region Capture 不可用，回退到 canvas 合成方案', e)
    }

    // 方案B：将 content 中的所有 <video> 元素合成绘制到 canvas
    const canvas = document.createElement('canvas')
    const rect = container.getBoundingClientRect()
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
    canvas.width = Math.max(640, Math.floor(rect.width * dpr))
    canvas.height = Math.max(360, Math.floor(rect.height * dpr))
    const ctx = canvas.getContext('2d')

    const draw = () => {
        try {
            ctx.clearRect(0,0,canvas.width,canvas.height)
            // 背景色与 content 一致
            ctx.fillStyle = '#dde5f4'
            ctx.fillRect(0,0,canvas.width,canvas.height)

            const videos = container.querySelectorAll('video')
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height

            videos.forEach((videoEl) => {
                try {
                    const vrect = videoEl.getBoundingClientRect()
                    const x = (vrect.left - rect.left) * scaleX
                    const y = (vrect.top - rect.top) * scaleY
                    const w = vrect.width * scaleX
                    const h = vrect.height * scaleY
                    if (videoEl.readyState >= 2 && w > 0 && h > 0) {
                        ctx.drawImage(videoEl, Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h))
                    }
                } catch {}
            })

            // 可选：在录制画面上叠加计时文本
            if (recording.value) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)'
                const tw = 90 * dpr
                const th = 32 * dpr
                const cx = canvas.width / 2 - tw / 2
                const cy = canvas.height / 2 - th / 2
                ctx.fillRect(cx, cy, tw, th)
                ctx.fillStyle = '#fff'
                ctx.font = `${16 * dpr}px sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(recordTimerText.value, canvas.width / 2, canvas.height / 2)
            }
        } catch {}
        if (recording.value) requestAnimationFrame(draw)
    }
    requestAnimationFrame(draw)
    return canvas.captureStream(30)
}

const startRecording = async () => {
    if (recording.value) return
    recording.value = true
    // 视频
    const videoStream = await captureContentVideo()
	// 音频
	const mixed = buildMixedAudioStream()
	// 合并
	composedStream = new MediaStream()
	videoStream.getVideoTracks().forEach(t=> composedStream.addTrack(t))
	mixed.getAudioTracks().forEach(t=> composedStream.addTrack(t))

	recordedChunks = []
	const mimeCandidates = [
		'video/mp4;codecs=avc1,mp4a',
		'video/webm;codecs=vp9,opus',
		'video/webm;codecs=vp8,opus',
		'video/webm'
	]
	let selectedMime = ''
	for (const m of mimeCandidates) {
		if (MediaRecorder.isTypeSupported(m)) { selectedMime = m; break }
	}
	mediaRecorder = new MediaRecorder(composedStream, selectedMime ? { mimeType: selectedMime, videoBitsPerSecond: 4_000_000 } : undefined)
	mediaRecorder.ondataavailable = (e)=>{ if (e.data && e.data.size > 0) recordedChunks.push(e.data) }
	mediaRecorder.onstop = async ()=>{
		try {
			const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || selectedMime || 'video/webm' })
			const arrayBuffer = await blob.arrayBuffer()
			const preferMp4 = (mediaRecorder.mimeType || selectedMime || '').includes('mp4')
			const ext = preferMp4 ? 'mp4' : ((mediaRecorder.mimeType || selectedMime || '').includes('webm') ? 'webm' : 'webm')
			await window.api.saveRecordingBuffer({ buffer: arrayBuffer, defaultFileName: `meeting-${meetingNo.value}-${Date.now()}`, extension: ext })
			ElMessage.success('录制已保存')
		} catch (e) {
			console.error('保存录制失败', e)
			ElMessage.error('保存录制失败: ' + e.message)
		}
		// 清理
		videoStream.getTracks().forEach(t=>t.stop())
		if (mixAudioStream) mixAudioStream.getTracks().forEach(t=>t.stop())
		if (audioContext) try { audioContext.close() } catch {}
		mediaRecorder = null
	}
    mediaRecorder.start(1000)
	startRecordTimer()
	if (sharing.value) {
		window.api.updateTipbarState({ recording: recording.value })
	}
}

const stopRecording = async () => {
	if (!recording.value) return
	recording.value = false
	if (recordTimer) { clearInterval(recordTimer); recordTimer = null; recordTimerText.value = '00:00' }
	if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
	if (sharing.value) {
		window.api.updateTipbarState({ recording: recording.value })
	}
}

const startRecordTimer = () => {
	let seconds = 0
	const fmt = (n)=> String(n).padStart(2,'0')
	recordTimerText.value = '00:00'
	recordTimer = setInterval(()=>{
		seconds += 1
		recordTimerText.value = `${fmt(Math.floor(seconds/60))}:${fmt(seconds%60)}`
	}, 1000)
}


watch(() => filteredMemberList.value, async () => {
	await nextTick()

	// 重新为所有需要视频的成员设置流
	peerConnectionMap.forEach((peerConnection, userId) => {
		const videoElement = videoRefs.value[userId]
		if (videoElement && videoElement.srcObject && document.contains(videoElement)) {
			playVideoWithRetry(videoElement, userId)
		}
	})
}, { deep: true })

// 监听成员数量变化，自动调整当前页
watch(() => totalPages.value, (newTotalPages) => {
	if (currentPage.value > newTotalPages && newTotalPages > 0) {
		currentPage.value = newTotalPages
	}
})
const shareScreen = () => {
	if (sharing.value) {
		// 停止屏幕共享
		stopScreenShare()
	} else {
		// 开始屏幕共享选择
		console.log("共享屏幕事件触发")
		showScreenShareDialog.value = true
	}
}

// 停止屏幕共享
const stopScreenShare = async () => {
	try {
		// 停止屏幕共享流
		if (localStream.value) {
			localStream.value.getTracks().forEach(track => track.stop())
			localStream.value = null
		}
		cameraOn.value = false
		const payload = {
			type: MessageTypeEnum.MEETING_USER_VIDEO_CHANGE,
			sendUserId: userInfo?.userId,
			openVideo: cameraOn.value,
			openMicro: microOn.value
		}
		sendGeneralMessage(payload)
		// 关闭tipbar窗口
		await window.api.closeScreenShareTipbar()

		// 重新显示会议室窗口
		await window.api.showMeetingWindow()

		// 重置状态
		sharing.value = false
		cameraOn.value = false

		// 重新获取摄像头流（如果之前开启了摄像头）
		await manageMediaTracks()
		await updateAllPeerConnections()

		ElMessage.success('屏幕共享已停止')
	} catch (error) {
		console.error('停止屏幕共享失败:', error)
		ElMessage.error('停止屏幕共享失败: ' + error.message)
	}
}

// 关闭屏幕共享弹窗
const closeScreenShareDialog = () => {
	showScreenShareDialog.value = false
}

// 开始屏幕共享
const startScreenShare = async (source) => {
	try {
		console.log('开始共享屏幕源:', source)
		sharing.value = true
		cameraOn.value = true
		// 停止之前的本地流
		if (localStream.value) {
			localStream.value.getTracks().forEach(track => track.stop())
		}
		const payload = {
			type: MessageTypeEnum.MEETING_USER_VIDEO_CHANGE,
			sendUserId: userInfo?.userId,
			openVideo: cameraOn.value,
			openMicro: microOn.value
		}
		sendGeneralMessage(payload)
		// 通过主进程设置要共享的源
		await window.electron.ipcRenderer.invoke('setScreenShareSource', source.id)

		// 使用选中的源获取屏幕流
		const stream = await navigator.mediaDevices.getDisplayMedia({
			audio: true,
			video: {
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				frameRate: { ideal: 30 }
			}
		})

		// 设置新的屏幕共享流
		localStream.value = stream
		if (localVideo.value) {
			localVideo.value.srcObject = stream
			localVideo.value.onloadedmetadata = () => {
				localVideo.value.play().catch(e => console.error('播放屏幕共享失败:', e))
			}
		}

		// 更新所有PeerConnection以发送屏幕共享流
		await updateAllPeerConnections()

		// 创建tipbar窗口
		await window.api.createScreenShareTipbar({
			meetingNo: meetingNo.value,
			nickName: nickName.value,
			isMuted: isMuted.value,
			cameraOn: cameraOn.value,
			recording: recording.value,
			sourceInfo: {
				type: source.type,
				name: source.name,
				id: source.id
			}
		})

		// 如果共享的是窗口，隐藏会议室窗口
		if (source.type === 'window') {
			console.log('共享窗口，隐藏会议室窗口')
			await window.api.hideMeetingWindow()
		}

		// 关闭弹窗
		showScreenShareDialog.value = false

		ElMessage.success(`正在共享: ${source.name}`)
	} catch (error) {
		console.error('屏幕共享失败:', error)
		ElMessage.error('屏幕共享失败: ' + error.message)
		showScreenShareDialog.value = false
		sharing.value = false
	}
}

const invite = () => { ElMessage.info('邀请功能开发中') }
const toggleMembers = async() => {
	// ElMessage.info('成员列表开发中') 
	rightPanelSelect.value = 1
	isShowChat.value = !isShowChat.value
	await window.electronAPI.showChatRoom({ show: isShowChat.value })
}
const toggleChat = async () => {
	// ElMessage.info('聊天面板开发中')
	rightPanelSelect.value = 0
	isShowChat.value = !isShowChat.value
	await window.electronAPI.showChatRoom({ show: isShowChat.value })
}
const toggleRecord = () => {
	if (!recording.value) {
		startRecording().catch(err=>{
			console.error('开始录制失败:', err)
			ElMessage.error('开始录制失败: ' + err.message)
		})
	} else {
		stopRecording().catch(err=>{
			console.error('停止录制失败:', err)
			ElMessage.error('停止录制失败: ' + err.message)
		})
	}
}
const endMeeting = () => { window.api?.meetingWindowControl?.('close') }
const controlWindow = async (action) => {
	if (action === 'close') {
		// 退出会议
		saveInMeeting(false)
		await window.electronAPI.sendTunnelMessage({
			winKey: "main",
			data: {
				inMeeting: false
			}
		})
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
	// width: var(--meeting-room-width);
	height: 100%;
	background: #0f1114;
	color: #fff;
	border-radius: 8px;
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
	// background: rgb(34, 115, 220);
	background-color: #616ed0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	-webkit-app-region: drag;
	height: 30px;
	border-top-left-radius: 8px;
	border-top-right-radius: 8px;

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
	background-color: #dde5f4;
	box-sizing: border-box;
	width: 1000px;
}

.video-area {
	background: rgba(255, 255, 255, 0.02);
	border-radius: 10px;
	padding: 10px;
	height: 100%;
	position: relative;

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

.recording-timer {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: rgba(0,0,0,0.6);
	color: #fff;
	padding: 6px 10px;
	border-radius: 6px;
	z-index: 20;
	font-weight: 700;
	letter-spacing: 1px;
}

// 分页按钮样式
.pagination-btn {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 40px;
	height: 40px;
	background: rgba(0, 0, 0, 0.6);
	border: none;
	border-radius: 50%;
	color: white;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
	transition: all 0.3s ease;

	&:hover {
		background: rgba(0, 0, 0, 0.8);
		transform: translateY(-50%) scale(1.1);
	}

	&.pagination-btn-left {
		left: 10px;
	}

	&.pagination-btn-right {
		right: 10px;
	}

	svg {
		width: 20px;
		height: 20px;
	}
}

// 分页指示器样式
.pagination-indicator {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 10px 0;
	background: rgba(0, 0, 0, 0.1);

	.pagination-dots {
		display: flex;
		gap: 8px;
		align-items: center;

		.pagination-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.4);
			cursor: pointer;
			transition: all 0.3s ease;

			&:hover {
				background: rgba(255, 255, 255, 0.6);
				transform: scale(1.2);
			}

			&.active {
				background: #616ed0;
				transform: scale(1.3);
			}
		}
	}
}

.video-card {
	position: relative;
	background: #f1f7fe;
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

	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: #000;
	}
}

.mid-container {
	display: flex;
}

.left-panel {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 50px);
}

.right-panel {
	display: flex;
	flex-direction: column;
	flex: 1;
	border-left: 2px solid #afafaf;
}

.bottom-bar {
	display: flex;
	justify-content: space-between;
	padding: 10px;
	height: 60px;
	box-sizing: border-box;
	background-color: #616ed0;
	align-items: center;
	width: 1000px;
	// border-bottom-left-radius: 8px;
	// border-bottom-right-radius: 8px;

	.comment-input-area {
		display: flex;
		background-color: rgb(240, 240, 240);
		align-items: center;
		border-radius: 6px;
		padding: 4px 8px;
		max-width: 300px;
		transition: background-color 0.2s ease;

		.comment-input {
			width: 120px;
			height: 26px;
			border: none;
			outline: none;
			box-shadow: none;
			background-color: transparent;
			caret-color: transparent;
			/* caret-color是光标的颜色 */
			transition: width 0.2s ease, caret-color 0s;
		}

		&:focus-within {
			background-color: rgb(229, 229, 229);

			.comment-input {
				// width: 180px;
				caret-color: auto;
			}
		}
	}
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

.cancel-area {
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgb(229, 229, 229);
	border-radius: 6px;
	width: 60px;
	height: 56px;
	font-size: 14px;
	color: #000;
	cursor: pointer;
}

.bottom-exit-bubble {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px 0px;
	flex-direction: column;
	position: absolute;
	bottom: 72px;
	width: 100px;
	right: 5px;
	background-color: #fff;
	border-radius: 6px;

	button {
		margin-left: 0;
		margin-top: 5px;
		margin-bottom: 5px;
	}
}

.top-exit-bubble {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px 0px;
	z-index: 1;
	flex-direction: column;
	position: absolute;
	// bottom: 72px;
	top: 60px;
	width: 100px;
	right: 5px;
	background-color: #fff;
	border-radius: 6px;

	button {
		margin-left: 0;
		margin-top: 5px;
		margin-bottom: 5px;
	}
}
</style>

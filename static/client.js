//Resolving navigator.mediaDevces.getUserMedia & RTCPeerConnection object as per the browser
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

var otherMemberId=''
var participantId=''
var localStream;
var remoteStream;
var sender;
var not_allowed = false;
var leftMeetingFlag=false;
var connectedUser;
var connectionobject;

var meetingId = location.search.split("=")[1]
var muteButton = document.querySelector("#muteButton")
var playButton = document.querySelector("#playButton")
var sendMessageButton = document.querySelector("#sendMessage")
var remoteVideo = document.querySelector('#remoteVideo')
var localVideo = document.querySelector('#localVideo')

var progressBar = document.getElementById('progressBar')
var progressDiv = document.getElementById('progressDiv')


var mediaConstraints ={
audio:true,
video:{height:400,width:300}}

navigator.mediaDevices.getUserMedia(mediaConstraints)
.then((stream)=>{localVideo.srcObject = stream
setTimeout(function(){progressBar.style.width = '100%'; progressBar.innerText='Getting things ready for you'},1000)
setTimeout(function(){progressDiv.style.display = 'none'}, 5000)
})
.catch((error)=>{console.log(error)})



//Setting up socket connection
var socket = io({'sync disconnect on unload': true, transports:['websocket']})

function peerConnection()
{
    //Creating RTCPeerConnectionObject
    const configuration = { iceServers: [{
                          urls: "turn:asia.myturnserver.net",
                          username: "allie@oopcode.com",
                          credential: "topsecretpassword"
                      }]};

    connectionobject = new RTCPeerConnection(configuration)
    dataChannel = connectionobject.createDataChannel("dataChannel")
    localStream = localVideo.srcObject
    localStream.getTracks().forEach((track)=>{connectionobject.addTrack(track)})

//Gather ice candidates & send it to peer
connectionobject.onicecandidate = function(ev){
        if(ev.candidate){
        socket.emit('newicecandidate',
            {'ice':ev.candidate,
            'connectedUser':connectedUser,
            'meetingId':meetingId})
        }
    }

//Adding remote stream to connection object
    remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;
    connectionobject.addEventListener('track', (event) => {
    remoteStream.addTrack(event.track, remoteStream);
    });

//Check if webrtc connection has been established
//Once the connection has established dynamically create leave & rejoin meeting buttons
    connectionobject.onconnectionstatechange = function(event){
        if(connectionobject.connectionState ==='connected'){
            console.log("connected to  "+ connectedUser)
            console.log(connectionobject)
            if(!document.getElementById('leaveMeeting')&& !not_allowed){
            mainDiv = document.getElementById('mainDiv')
            button = document.createElement('button')
            button.id = 'leaveMeeting'
            button.innerText = "Leave Meeting"
            mainDiv.appendChild(button)
            button.onclick = function(evt){
            localStream.getTracks().forEach((track)=>{track.enabled = false})
            localVideo.srcObject = null
            newButton = document.createElement('button')
            newButton.id = 'rejoinMeeting'
            newButton.innerText = "Rejoin Meeting"
            button.style.display = 'none'
            mainDiv.appendChild(newButton)
            newButton.onclick = function(evt){
            localVideo.srcObject = localStream
            localStream.getTracks().forEach((track)=>{track.enabled = true})
            newButton.style.display = 'none'
            button.style.display = 'block'
            socket.emit('rejoinMeeting', {'meetingId':meetingId, 'connectedUser': connectedUser})
            }
            socket.emit('remoteRemoveVideo', {'meetingId':meetingId,'connectedUser':connectedUser})
            }}}}

//Event to capture creation of data channel
    connectionobject.addEventListener('datachannel', event => {
        dataChannel = event.channel;
        console.log("Data Channel Created")
    });

//Data Channel event when message is received
    dataChannel.addEventListener('message', event => {
        message = event.data;
        var recvData = document.querySelector('#receivedMessage')
        li = document.createElement('li')
        li.setAttribute('class', 'list-group-item')
        text = document.createTextNode(message)
        li.appendChild(text)
        li.class = 'list-group-item'
        recvData.appendChild(li)
    })
    return connectionobject
}

//Event to mute & unmute mute video
muteButton.onclick = (ev)=>{
    localStream.getTracks()[0].enabled=!localStream.getTracks()[0].enabled
    if(localStream.getTracks()[0].enabled){
        muteButton.innerHTML = "MUTE"
    }else{
    muteButton.innerHTML = "UNMUTE"
    }
}

//Event to pause & resume video
pauseButton.onclick =(ev)=> {
    localStream.getTracks()[1].enabled=!localStream.getTracks()[1].enabled
    if(localStream.getTracks()[1].enabled){
        pauseButton.innerHTML = "PAUSE"
    }else{
        pauseButton.innerHTML = "PLAY"
    }
}

//Send message to peer
sendMessageButton.onclick = (ev)=> {
    var msgBox = document.querySelector("#msgBox")
    var sentData = document.querySelector("#sentMessage")
    msg = msgBox.value
    msgBox.value = ''
    li = document.createElement('li')
    text = document.createTextNode(msg)
    li.appendChild(text)
    li.setAttribute('class', 'list-group-item')
    sentData.appendChild(li)
    dataChannel.send(msg)
}

//Create Join meeting button and emit enter meeting event to the server
        if(!leftMeetingFlag && !not_allowed){
        mainDiv = document.querySelector("#mainDiv")
        br = document.createElement('br')
        mainDiv.appendChild(br)
        text = document.createTextNode("Join Now")
        button = document.createElement("button")
        button.id = 'joinMeeting'
        button.class = 'btn btn-lg btn-info'
        button.onclick = function(evt){
        socket.emit("enterMeeting",{'meetingId':meetingId})
        button.remove()
        }
        button.appendChild(text)
        mainDiv.appendChild(button)}


//Check other participants in meeting
socket.on('connect', function(){
    socket.emit('checkParticipant', meetingId)
})


//Notify current user if there is any other participant in the meeting
socket.on('checkedParticipant',function(msg){
    console.log("Checked Participant")
    connectedUser = msg
    mainDiv = document.querySelector('#mainDiv')
    label = document.createElement('label')
    label.id = 'otherMemberLabel'
    label.class = 'label label-warning'
    if(msg)
        text = document.createTextNode('One member is already in the meeting')
    else
        text = document.createTextNode("Nobody has joined the meeting")
    label.appendChild(text)
    mainDiv.appendChild(label)
})


//Notifying other user when closing the browser
window.onbeforeunload = function(){
if (participantId){
socket.emit('leftMeeting', {'meetingId':meetingId,
                            'leftParticipantId':participantId,
                            'connectedUser':connectedUser})
}}

//Recreating Peer Connection object one the other partcipant left the meeting.
socket.on('leftMeeting', function(){
    leftMeetingFlag = true
    remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;
    console.log('User has left meeting')
    connectionobject = peerConnection()
    if(document.getElementById("#joinMeeting")){
    console.log('hello')
    document.getElementById("#joinMeeting").style.display = 'none'}
    otherMemberLabel = document.getElementById('otherMemberLabel')
    otherMemberLabel.innerText = 'One participant has left the meeting'
})

//Notify user if two members are already in the meeting
socket.on("notAllowed", function(msg){
    not_allowed = true
    if(document.getElementById("#joinMeeting"))
    {document.getElementById("#joinMeeting").style.display = 'none'}
    mainDiv = document.querySelector('#mainDiv')
    label = document.createElement('label')
    label.id = 'notAllowed'
    label.class = 'label label-warning'
    text = document.createTextNode('Two members are already in the meeting')
    label.appendChild(text)
    mainDiv.appendChild(label)
})

// Remove remote video, once user has left the meeting
socket.on("remoteRemoveVideo", function(){
    remoteVideo.srcObject = null
})

//Updating participant and other participant ids, use has joined the meeting.
//Create offer if a user is already in meeting
socket.on('meetingJoined',function(msg){
    connectionobject = peerConnection()
    otherMemberLabel = document.getElementById('otherMemberLabel')
    otherMemberLabel.innerText = "You have joined the meeting."
    participantId = msg.participantId
    connectedUser = msg.otherMemberId
    console.log("Other Member Id")
    console.log(msg.otherMemberId)
    if(msg.otherMemberId){
    connectionobject.createOffer().then((offer)=>{
        return connectionobject.setLocalDescription(offer)}).
        then(()=>{
        console.log('create offer')
        socket.emit('createOffer',{'offer': connectionobject.localDescription,
                                    'meetingId': meetingId,
                                    'connectedUser': participantId,
                                    'otherParticipantId': connectedUser})
})}})

//Create an answer once the user has received an offer and
//send it to other user.
socket.on('receiveOffer', function(msg){
    console.log('receive offer')
    if (leftMeetingFlag){
    document.getElementById("otherMemberLabel").innerText = "New participant has joined the meeting"
    }
    connectedUser = msg.connectedUser
    connectionobject.setRemoteDescription(new RTCSessionDescription(msg.offer))
    .then(()=>{ return connectionobject.createAnswer()})
    .then( (answer) => {return connectionobject.setLocalDescription(new RTCSessionDescription(answer))})
    .then(()=>{socket.emit('answer', {'answer':connectionobject.localDescription,
                                    'connectedUser':connectedUser,
                                    'meetingId':meetingId})})
    .catch((err)=>{console.log(err)})})

//Create an answer and send it to the user
socket.on('answer', function(msg){
    console.log("answer")
    connectionobject.setRemoteDescription(new RTCSessionDescription(msg))})

//Event emitted from server once an ice candiadte has been received
socket.on('ice', (ice)=>{
    connectionobject.addIceCandidate(ice)
})

//Set remote video strean source  to back to stream, Once the user has rejoined the meeting
socket.on("rejoinMeeting",function(msg){
remoteVideo.srcObject = remoteStream
})
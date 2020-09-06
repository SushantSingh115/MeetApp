var socket = io({'sync disconnect on unload': true, transports:['websocket']})
var generateMeetingButton = document.querySelector("#generateLink")
generateMeetingButton.onclick = function(event){
socket.emit("generateMeeting")}

socket.on("meetingCreated", function(msg){
console.log("Meeting Created")
var meetURl = location.protocol+'//'+location.host+'/meet/?meetingid='+msg.meetingId
if (document.querySelector("#meetURL")){
   document.querySelector("#meetURL").innerText = meetURl
}
else{
var p = document.createElement('p')
var text = document.createTextNode(meetURl)
p.class = "lead"
p.appendChild(text)
p.id ="meetURL"
generateMeetingButton.parentNode.appendChild(p)}
if(!document.querySelector("#copyButton")){
    copyButton = document.createElement('button')
    copyButton.id = 'copyButton'
    copyButton.class = 'btn-sm btn-primary'
    generateMeetingButton.parentNode.appendChild(copyButton)
    copyButton.innerText = 'Copy'
    copyButton.onclick = function(evt){
        var range = document.createRange();
        var selection = window.getSelection();
        range.selectNodeContents(document.getElementById('meetURL'));
        selection.removeAllRanges()
        selection.addRange(range)
        document.execCommand("copy")}}})
About Application A webrtc based demo applicatin for nstant one to one conferencing. Application is deployed on heroku.

Application Link https://sleepy-savannah-20248.herokuapp.com/


Features

1. One to One Video Conferencing App
2. One to One chat

Technology

1. Javascript
2. python-socketio
3. eventlet


How to set up a meeting?

Please follow below  steps to start a meeting-

1. Go to the link - https://sleepy-savannah-20248.herokuapp.com/
2. Click on generate meeting link. 
3. Copy the meeting link & share the same with person to whom you want to have a conference call 
4. Click on 'Join Now' button to join the meeting. 
5. Wait for the other person to join the meeting.

Sometimes heroku server is slow to respond to websockets. 
Probably because  I am using their free services. Kindly refresh the page if you are unable to connect.

Files:

1. index.html - HTML page to setup a meeting
2. meet.html - HTML page to have conference.
3. index.js - js file to generate meeting link
4. client.js - Webrtc Implemetation & interatction with signalling server
5. main.py - Signalling server
6. initialize.py - initializes variables



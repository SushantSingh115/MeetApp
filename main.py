import eventlet
import socketio
import initialize

sio = socketio.Server()
app = socketio.WSGIApp(sio, static_files={
    '/': {'content_type': 'text/html', 'filename': 'templates/index.html'},
    '/meet/': {'content_type': 'text/html', 'filename': 'templates/meet.html'},
    '/static/client.js': {'content_type': 'text/javascript', 'filename': 'static/client.js'},
    '/static/index.js': {'content_type': 'text/javascript', 'filename': 'static/index.js'},
})

# Method to Generate Participant
def participantId():
    newParticipant = 'participant' + str(initialize.participant)
    initialize.participant = initialize.participant + 1
    return newParticipant


# Method to generate Meeting Ids
def generateMeetinId():
    newMeetingId = 'meet' + str(initialize.meetingId)
    initialize.meetingId = initialize.meetingId + 1
    return newMeetingId


# Event to Generate Meeting
@sio.on('generateMeeting')
def generateMeeting(sid):
    newMeetingId = generateMeetinId()
    initialize.meetings[newMeetingId] = {}
    msg = {'meetingId': newMeetingId}
    sio.emit('meetingCreated', msg, room=sid)


# Event to check how many participants are in the meeting
@sio.on('checkParticipant')
def checkParticipant(sid, meetingId):
    print("check participant")
    otherMemberId = ''
    totalMembers = 0
    if bool(initialize.meetings[meetingId]):
        totalMembers = len([key for key in initialize.meetings[meetingId].keys()])
        otherMemberId = [key for key in initialize.meetings[meetingId]][0]
    if totalMembers == 2:
        sio.emit('notAllowed', room=sid)
    else:
        sio.emit('checkedParticipant', otherMemberId, room=sid)


# Event to manage user entry in meeting
@sio.on('enterMeeting')
def enterMeeting(sid, msg):
    meetingId = msg['meetingId']
    newParticipant = participantId()
    otherMember = False
    otherMemberId = ''
    if bool(initialize.meetings[meetingId]):
        key = [key for key in initialize.meetings[meetingId]][0]
        otherMemberId = key
    initialize.meetings[meetingId][newParticipant] = sid
    sio.emit('meetingJoined', {'participantId': newParticipant,
                                     'otherMember': otherMember,
                                     'otherMemberId': otherMemberId}, room=sid)


# Event to manage offer created by a participant
@sio.on('createOffer')
def createOffer(sid, msg):
    meetingId = msg['meetingId']
    connectedUser = msg['connectedUser']
    participantId = msg['otherParticipantId']
    room = initialize.meetings[meetingId][participantId]
    sio.emit('receiveOffer', {'meetingId': meetingId,
                                    'offer': msg['offer'],
                                    'connectedUser': connectedUser},
                   room=room)


# Event to manage answer created by a participant
@sio.on('answer')
def answer(sid, msg):
    meetingId = msg['meetingId']
    connectedUser = msg['connectedUser']
    room = initialize.meetings[meetingId][connectedUser]
    sio.emit('answer', msg['answer'], room=room)


# Event to exchange new ice candidates
@sio.on('newicecandidate')
def newicecandidate(sid, msg):
    meetingId = msg['meetingId']
    connectedUser = msg['connectedUser']
    room = initialize.meetings[meetingId][connectedUser]
    sio.emit('ice', msg['ice'], room=room)


# Event to manage once user has left meeting
@sio.on('leftMeeting')
def leftMeeting(sid, msg):
    meetingId = msg['meetingId']
    leftParticipantId = msg['leftParticipantId']
    del initialize.meetings[meetingId][leftParticipantId]
    try:
        connectedUser = msg['connectedUser']
        room = initialize.meetings[meetingId][connectedUser]
        sio.emit('leftMeeting', room=room)
    except:
        print("User was not in meeting")
    finally:
        print("User removed")


# Event to manage local & remote video, once a user has left the meeting
@sio.on('remoteRemoveVideo')
def remoteRemoveVideo(sid, msg):
    print("remove Remote Video")
    meetingId = msg['meetingId']
    connectedUser = msg['connectedUser']
    room = initialize.meetings[meetingId][connectedUser]
    sio.emit('remoteRemoveVideo', room=room)


# Event to manage local & remote video, once a user has rejoined the meeting
@sio.on("rejoinMeeting")
def rejoinMeeting(sid, msg):
    meetingId = msg['meetingId']
    connectedUser = msg['connectedUser']
    room = initialize.meetings[meetingId][connectedUser]
    sio.emit('rejoinMeeting', room=room)


# Event to notify once the user has left the meeting
@sio.event
def disconnect(sid):
    print(sid)
    print("I'm disconnected!")


if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('', 5000)), app)

Skip to content
Search or jump to…
Pull requests
Issues
Marketplace
Explore

@Awais1097
Awais1097
    /
    abdulhaddi
Public template
Code
Issues
Pull requests
Actions
Projects
Wiki
Security
Insights
Settings
abdulhaddi / script.js /
@Awais1097
Awais1097 Update script.js
…
Latest commit d78930c 1 minute ago
History
1 contributor
307 lines(266 sloc)  9.14 KB

// Generate random room name if needed
if (!location.hash) {
    location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
const roomHash = location.hash.substring(1);
const roomName = 'observable-' + roomHash;

// TODO: Replace with your own channel ID
var drone;
let members = [];
let msgs = [];
let room;
let pc;

function connection() {
    document.getElementById("room-switch").style.visibility = 'hidden';
    document.getElementById("room-button").style.visibility = 'hidden';
    drone = new ScaleDrone('W0qVprhBjTQ5YXlA', {
        data: { // Will be sent out as clientData via events
            name: document.getElementById("room-input").value,
            color: getRandomColor(),
        },
    });
    document.getElementById("local-name").textContent = document.getElementById("room-input").value;
    drone.on('open', error => {
        if (error) {
            return console.error(error);
        }
        room = drone.subscribe(roomName);
        room.on('open', error => {
            if (error) {
                onError(error);
            }
        });
        // We're connected to the room and received an array of 'members'
        // connected to the room (including us). Signaling server is ready.
        room.on('members', m => {
            console.log('MEMBERS', m);
            members = m;
            // If we are the second user to connect to the room we will be creating the offer
            const isOfferer = members.length === 2;
            startWebRTC(isOfferer);
            updateMembersDOM();
        });

        room.on('member_join', member => {
            members.push(member);
            updateMembersDOM();
        });

        room.on('member_leave', ({ id }) => {
            const index = members.findIndex(member => member.id === id);
            members.splice(index, 1);
            updateMembersDOM();
        });
        //   room.on('data', (message, client) => {
        //      console.log('message', message);
        //      console.log('client', client );
        // 	 if (message.text) {
        // 		if (client) {
        //  		msgs.push(message);
        //                 addMessageToListDOM(message, client);
        // 		}
        //             } else {
        //                 // Message is from server
        //             }

        //   });

        //  room.on('data', (text, member) => {
        //   messages.push(text.toString() + member.toString());
        //   console.log(text, member);
        //  if (member) {
        //      addMessageToListDOM(text, member);
        // } else {
        // Message is from server
        //   }
        //});

    });

}

const DOM = {
    membersList: document.getElementById('participants'),
    messages: document.querySelector('.chat-area'),
    input: document.querySelector('.chat-input'),
};


function updateMembersDOM() {
    DOM.membersList.innerHTML = '';
    members.forEach(member =>
        DOM.membersList.appendChild(createMemberElement(member))
    );
    // DOM.membersList.appendChild(createMemberElementCount(members.length + ''));
}


function createMemberElement(member) {
    const { name, color } = member.clientData;
    const el = document.createElement('a');
    el.textContent = name;//appendChild(document.createTextNode(name));
    el.className = 'participant-more';
    // el.style.color = color;
    if (member.id === drone.clientId) {
        document.getElementById("local-name").textContent = name;
    } else {
        document.getElementById("remote-name").textContent = name;
    }
    return el;
}

function createMemberElementCount(member) {
    const el = document.createElement('a');
    el.textContent = member;//appendChild(document.createTextNode(member));
    el.className = 'participant-more';
    return el;
}


function addMessageToListDOM(text, client) {
    const el = DOM.messages;
    el.appendChild(createMessageElement(text, client));
    const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
    // if (wasTop) {
    el.scrollTop = el.scrollHeight;
    // }
}

function createMessageElement(text, client) {
    const { name, color } = client.clientData;
    const elc = document.createElement('div');
    elc.appendChild(document.createTextNode(name));
    const elm = document.createElement('div');
    elm.appendChild(document.createTextNode(text.text));
    elc.className = 'name';
    elm.className = 'message';
    const eld = document.createElement('div');
    eld.appendChild(elc);
    eld.appendChild(elm);
    eld.className = 'message-content';
    if (client.id === drone.clientId) {
        const el = document.createElement('div');
        el.appendChild(eld);
        el.className = 'message-wrapper reverse';
        return el;
    } else {
        const el = document.createElement('div');
        el.appendChild(eld);
        el.className = 'message-wrapper';
        return el;
    }

}

// Room name needs to be prefixed with 'observable-'
const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
    }]
};



function onSuccess() { };
function onError(error) {
    console.error(error);
};


// Send signaling data via Scaledrone
function sendMessage(message) {
    console.log('message', message);

    drone.publish({
        room: roomName,
        message
    });
    document.getElementById("chat-input").value = '';
}
//DOM.form.addEventListener('submit', sendMessage());

function startWebRTC(isOfferer) {
    pc = new RTCPeerConnection(configuration);

    // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
    // message to the other peer through the signaling server
    pc.onicecandidate = event => {
        if (event.candidate) {
            sendMessage({ 'candidate': event.candidate });
        }
    };

    // If user is offerer let the 'negotiationneeded' event create the offer
    if (isOfferer) {
        pc.onnegotiationneeded = () => {
            pc.createOffer().then(localDescCreated).catch(onError);
        }
    }

    // When a remote stream arrives display it in the #remoteVideo element
    pc.onaddstream = event => {
        remoteVideo.srcObject = event.stream;
    };

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    }).then(stream => {
        // Display your local video in #localVideo element
        localVideo.srcObject = stream;
        // Add your stream to be sent to the conneting peer
        pc.addStream(stream);
    }, onError);

    // Listen to signaling data from Scaledrone
    room.on('data', (message, client) => {
        console.log('message', message);
        console.log('client', client);
        if (message.text) {
            if (client) {
                msgs.push(message);
                addMessageToListDOM(message, client);
            }
        } else {
            // Message was sent by us
            if (client.id === drone.clientId) {
                return;
            }
            if (message.sdp) {
                // This is called after receiving an offer or answer from another peer
                pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
                    // When receiving an offer lets answer it
                    if (pc.remoteDescription.type === 'offer') {
                        pc.createAnswer().then(localDescCreated).catch(onError);
                    }
                }, onError);
            } else if (message.candidate) {
                // Add the new ICE candidate to our connections remote description
                pc.addIceCandidate(
                    new RTCIceCandidate(message.candidate), onSuccess, onError
                );
            }
        }

        
    });
}

function localDescCreated(desc) {
    pc.setLocalDescription(
        desc,
        () => sendMessage({ 'sdp': pc.localDescription }),
        onError
    );
}

const switchMode = document.querySelector('button.mode-switch'),
    body = document.querySelector('body'),
    closeBtn = document.querySelector('.btn-close-right'),
    rightSide = document.querySelector('.right-side'),
    expandBtn = document.querySelector('.expand-btn');
videor = document.querySelector('.btn-muter');


switchMode.addEventListener('click', () => {
    body.classList.toggle('dark');
});
closeBtn.addEventListener('click', () => {
    rightSide.classList.remove('show');
    expandBtn.classList.add('show');
});
expandBtn.addEventListener('click', () => {
    rightSide.classList.add('show');
    expandBtn.classList.remove('show');
});

function getURL() {
    return window.location.href;
}

function getMessage() {
    return { 'text': DOM.input.value, 'name': document.getElementById("local-name").textContent + '.\t' };
}

function copy(input) {
    console.log('input', input);
    if (navigator.clipboard) {
        navigator.clipboard.writeText(input).then(() => {
            console.log('Copied to clipboard successfully.');
            window.alert('Link: ' + input + '\nCopied to clipboard successfully.')
        }, (err) => {
            console.log('Failed to copy the text to clipboard.', err);
        });
    } else if (window.clipboardData) {
        window.clipboardData.setData("Text", input);
    }
}


function getRandomColor() {
    return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

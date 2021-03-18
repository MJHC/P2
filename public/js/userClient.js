let prev_X, prev_Y;
let muted;
let clicks = 0;
// Creates a new HTML user object.
function instantiateUser(user){
  const userTemp = document.getElementById("userTemplate").content;
  const userHTML = document.importNode(userTemp,true);
  const userBody = userHTML.querySelector(".body");
  const userContainer = userHTML.querySelector(".user-container");
  const color = user.color;
  const id    = user.id;

  //Gives the container and the body an id
  userContainer.setAttribute('id', id);
  userBody.setAttribute('id', id + '_body');

  // Updates initial pos of the user
  user.pos.top  = userContainer.style.top  = user.pos.top + "px";
  user.pos.left = userContainer.style.left = user.pos.left + "px";

  userBody.style.backgroundColor = color;
  userBody.style.fill = color;

  // Update the name from template.
  const text = userHTML.querySelector('.name');
  text.textContent = user.name;
  text.setAttribute('id', id + '_name');

  document.getElementById("space").appendChild(userHTML);

  return userBody;
}

//enables the user to rotate
function userRotation(e, user, socket){
  const id    = user.id;
  const userElement   = document.getElementById(id + '_body');
  const userContainer = document.getElementById(id);
  const space = document.getElementById("space");

  // Updates the mouse pos relative to the space div.
  let mouseX = e.clientX - space.offsetLeft;
  let mouseY = e.clientY - space.offsetTop;

  // Updates user pos from middle.
  let userX = userContainer.offsetTop - mouseY + (115/2);
  let userY = userContainer.offsetLeft - mouseX + ((115+98)/2);

  // Calculate user rotation.
  let o = user.rad = -1 * Math.atan2(userY, userX);

  // Applies the rotation to the user.
  userElement.style.transform = "rotate(" + o + "rad)";

  //user rotation is send to the server here
  socket.emit('update-user-rot', user.id, user.rad);
}

function menuPopUp(e){
  const menu = document.getElementById("popup");
  e.preventDefault();
  if (clicks % 2 === 0){
    menu.style.display = "block";
    let biased_x = parseInt(e.clientX) - 90;
    let biased_y = parseInt(e.clientY) - 270;
    menu.style.left = biased_x.toString() + "px";
    menu.style.top = biased_y.toString() + "px";
    clicks++;
}
  else{
    menu.style.display = "none";
    clicks--;
  }
}

function muteUser(id){
  let mic = document.getElementById(id);
  let img = document.getElementById("speakers");

  console.log(mic.muted);
  // Changes mute picture
  if (mic.muted === true){
    img.src="./resources/speakerIcon.svg";
    mic.muted = false;
  }
  else{
    img.src="./resources/speakerIconMuted.svg";
    mic.muted = true;
  }
}

function moveDiff(user){
  let current_X = user.pos.left;
  let current_Y = user.pos.top;
  return (current_X - prev_X === 0  && current_Y - prev_Y === 0 ? true : false); 
}

//enables the user to move around.
function userMove(user, socket) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const id = user.id;
  const containerElement = document.getElementById(id);
  const userElement = document.getElementById(id + '_body')

  userElement.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();

    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragUser;
    document.onmousemove = userDrag; 
    
    // Stores the previous users pos
    
    prev_X = user.pos.left;
    prev_Y = user.pos.top;

    // Hides the popUpMenu when the user moves their character.
    const menu = document.getElementById("popup");
    if (moveDiff(user) && menu.style.display == "block"){
        menu.style.display = "none";
      }
  }

  function userDrag(e) {
    e.preventDefault();

    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    user.pos.top  = (containerElement.offsetTop - pos2);
    user.pos.left = (containerElement.offsetLeft - pos1);

    containerElement.style.top = user.pos.top + "px";
    containerElement.style.left = user.pos.left + "px";

    //user position is send to the server here
    socket.emit('update-user-pos', user.id, user.pos);
  }

  function closeDragUser() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function deleteDisconnectedUser(id){
  const userElement = document.getElementById(id);
  if (userElement !== null)
    userElement.remove();
}

//Make audio object and get new user connection
function connectToNewUser(userId, stream, myPeer, peers) {
  const call = myPeer.call(userId, stream);

  const audio = document.createElement('audio');
  audio.setAttribute("id", id);

  //when recieving new stream add it to audio container
  call.on('stream', userAudioStream=>{ addAudioStream(audio, userAudioStream); });

  //delete audio object
  call.on('close', ()=>{ audio.remove(); });

  // connect id to call
  peers[userId] = call;
}

//add audio object to audio container
function addAudioStream(audio, stream) {
  audio.srcObject = stream;
  audio.addEventListener('loadedmetadata', ()=>{
    audio.play(); 
    audio.muted = false;
  });
}
var config = {
    type: Phaser.AUTO,
    parent: document.getElementById("game"),
    scale: {
        width: 800*1.5,
        height: 600*1.5
    },
    dom: {
        createContainer: true
    },
    scene: {
        create: create,
        preload: preload,
        update: update
        
    },
};



function onMainInput() {
    currentText = element.node.value;
    currentWordCount = currentText.trim().split(' ').length;
    if (currentText === "") {
        currentWordCount = 0;
    }
    
    if (!currentlyTyping[me]){
        socket.send('{"message":"typing", "action":"sendmessage"}');
        currentlyTyping[me] = true;
        timeout = window.setTimeout(noMoreInput, 500);
    } else {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(noMoreInput, 500);
    }
}

function noMoreInput() {
    //not typing anymore - send a msg to the serve 
    socket.send('{"message":"nottyping", "action":"sendmessage"}');
    currentlyTyping[me] = false;
}


var timeout;
var element;
var timeleft = -1;
currentlyTyping = [false, false, false, false];
var currentText;
var timertext;
var currentWordCount = 0;
var me = 1;
var state = 0; //initial = 0, battle = 1, waiting for essays = 2, feedback = 3, waiting for writing = 4, writing phase again = 5, game over = 6
var game = new Phaser.Game(config);
var players = new Array(4);
var playerText = new Array(4);
var prompttext
var feedbacktext
var predone = false;
var prefeedbacktext
var line
var myfeedbacktext
var myfeedbackdone
var startscreen = true

let socket = new WebSocket("wss://syrj2md5wc.execute-api.us-west-2.amazonaws.com/production");

window.onbeforeunload = function() {
    socket.onclose = function () {}; // disable onclose handler first
    socket.close();
};

socket.onmessage = function(event){
    let jsevent = JSON.parse(event.data);
    console.log(jsevent.message, state);
    if (jsevent.message === "typing") {
        currentlyTyping[jsevent.id] = true;
    } else if (jsevent.message === "nottyping"){
        currentlyTyping[jsevent.id] = false;
    } else if (jsevent.message === "game start" && state == 0){
        state = 1;
        timeleft = 45;
        statetext.text = "Writing stage!"
        element.node.readOnly = false;
        window.setTimeout(ticker, 1000);
    } else if (jsevent.message === "donewriting") {
        if (state == 1){
            predone = true;
            prefeedbacktext = jsevent.essay;
        } else {
            //feedback phase is now starting
            prefeedbacktext = jsevent.essay;
            startFeedback();
        }
    } else if (jsevent.message === "donefeedback"){
        if (state == 3){
            myfeedbackdone = true;
            myfeedbacktext = jsevent.essay;
        } else {
            myfeedbacktext = jsevent.essay;
            endFeedback();
        }
    } else {
        me = jsevent.id;
        if (me == 3) {
            state = 1;
            timeleft = 45;
            statetext.text = "Writing stage!"
            element.node.readOnly = false;
            window.setTimeout(ticker, 1000);
        }
        playerText[me].style.setColor("#ff0000");
        playerText[me].text = "You (Player " + (me+1)+ ")";
        playerText[me].x -= 30;

        
    }
}

socket.onopen = function(e) {
    socket.send('{"action": "getid"}')
}

function secondsToText(left){
    if (left == -2){
        return "waiting!"
    }
    if (left == -1){
        return "???"
    }
    var sec = (left%60).toString()
    if (sec.length == 1){
        sec = "0" + sec;
    }
    return Math.floor(left/60) + ":" + sec;
}

function ticker(){
    if (state == 1 || state == 3) {
        timeleft--;
        window.setTimeout(ticker, 1000);
    }
    
}

function preload ()
{

    this.load.image('back', 'back.png');
    this.load.image("start", "start.png")

    //strawberry
    this.load.image('1t1', '/strawberry/thinking1.png');
    this.load.image('1t2', '/strawberry/thinking2.png');
    this.load.image('1t3', '/strawberry/thinking3.png');
    this.load.image('1t4', '/strawberry/thinking4.png');
    this.load.image('1w1', 'strawberry/writing1.png');
    this.load.image('1w2', 'strawberry/writing2.png');
    this.load.image('1w3', 'strawberry/writing3.png');
    
    //pear
    this.load.image('2t1', '/pear/thinking1.png');
    this.load.image('2t2', '/pear/thinking2.png');
    this.load.image('2t3', '/pear/thinking3.png');
    this.load.image('2t4', '/pear/thinking4.png');
    this.load.image('2w1', 'pear/writing1.png');
    this.load.image('2w2', 'pear/writing2.png');
    this.load.image('2w3', 'pear/writing3.png');

    //mango
    this.load.image('3t1', '/mango/thinking1.png');
    this.load.image('3t2', '/mango/thinking2.png');
    this.load.image('3t3', '/mango/thinking3.png');
    this.load.image('3t4', '/mango/thinking4.png');
    this.load.image('3w1', 'mango/writing1.png');
    this.load.image('3w2', 'mango/writing2.png');
    this.load.image('3w3', 'mango/writing3.png');

    //grape
    this.load.image('4t1', '/grape/thinking1.png');
    this.load.image('4t2', '/grape/thinking2.png');
    this.load.image('4t3', '/grape/thinking3.png');
    this.load.image('4t4', '/grape/thinking4.png');
    this.load.image('4w1', 'grape/writing1.png');
    this.load.image('4w2', 'grape/writing2.png');
    this.load.image('4w3', 'grape/writing3.png');

}

function startFeedback () {
    state = 3;
    statetext.text = "Feedback stage!"
    wordtext.text = "Player " + (me != 0 ? me : 4) + "'s text"
    wordtext.visible = true;
    timeleft = 90;
    feedbacktext.node.visibility = "visible";
    feedbacktext.node.value = prefeedbacktext;
    //alert(prefeedbacktext)
    feedbackinput.node.visibility = "visible";
    feedbackinput.node.placeholder = "Give feedback here!"
    feedbackinput.node.focus();
    window.setTimeout(ticker, 1000);
}

function endFeedback () {
    state = 5;
    statetext.text = "2nd writing stage!";
    wordtext.text = "Word count: " + currentWordCount;
    timeleft = 90;
    element.node.visibility = "visible";
    element.node.value = myfeedbacktext;
    feedbacktext.node.visibility = "hidden";
    feedbackinput.node.visibility = "hidden";
    element.node.focus();
    feedbackinput.node.placeholder = ""

}

function loadFont(name, url) {
    var newFont = new FontFace(name, `url(${url})`);
    newFont.load().then(function (loaded) {
        document.fonts.add(loaded);
    }).catch(function (error) {
        return error;
    });
}

function create ()
{

    loadFont("dreamwood", "Dreamwood.ttf")

    var startscreen = this.add.sprite(600,450, "start")
    startscreen.setDepth(10);

    this.add.sprite(600, 450, 'back');

    this.input.on(Phaser.Input.Events.POINTER_DOWN, function (pointer) {
        startscreen.setDepth(-1);
        element.x = 610;
        element.y = 690;
    }, this);

    element = this.add.dom(9000, 9000, '#battle');
    element.node.focus()
    element.node.addEventListener("input", onMainInput);

    feedbacktext = this.add.dom(380, 685, '#feedbacktext')
    feedbacktext.node.visibility = "hidden";

    feedbackinput = this.add.dom(820, 685, '#feedbackinput')
    feedbackinput.node.visibility = "hidden";

    for (var i = 0; i<4; i++) {
        players[i] = this.add.sprite(550 + 150*i, 190, ((i%4) + 1) + "t1");
    }
    for (var i = 0; i<4; i++){
        players[i].setScale(0.65);
    }
    for (var i = 0; i<4; i++){
        playerText[i] = this.add.text(467 + i*150, 300, "Player "  + (i+1), {fontFamily: 'Garamond', color: '#000000', "fontSize": 25});
    }
    timertext = this.add.text(870,410, "Time left: " + secondsToText(timeleft), {fontFamily: 'Garamond', 'fontSize': 18, 'color': '#000000'});
    wordtext = this.add.text(870, 440, "Word count: " + currentWordCount, {fontFamily: 'Garamond', 'fontSize': 18, 'color': '#000000'})
    prompttext = this.add.text(120, 410, "Prompt: What superpower would you like to have and why?",
        {fontFamily: 'Garamond', 'fontSize': 20, 'color': '#000000'}); 

    statetext = this.add.text(870, 380, "Waiting for others", {fontSize: 18, color: '#000000', fontFamily: 'Garamond'})

    
    var f1t = this.anims.create({
        key: '1t',
        frames: [
            {key: "1t1"},
            {key: "1t2"},
            {key: "1t3"},
            {key: "1t4"},
        ],
        frameRate: 3,
        repeat: -1
    });

    var f1w = this.anims.create({
        key: '1w',
        frames: [
            {key: "1w1"},
            {key: "1w2"},
            {key: "1w3"},
        ],
        frameRate: 3,
        repeat: -1
    });

    var f2t = this.anims.create({
        key: '2t',
        frames: [
            {key: "2t1"},
            {key: "2t2"},
            {key: "2t3"},
            {key: "2t4"},
        ],
        frameRate: 3,
        repeat: -1
    });

    var f2w = this.anims.create({
        key: '2w',
        frames: [
            {key: "2w1"},
            {key: "2w2"},
            {key: "2w3"},
        ],
        frameRate: 3,
        repeat: -1
    });

    var f3t = this.anims.create({
        key: '3t',
        frames: [
            {key: "3t1"},
            {key: "3t2"},
            {key: "3t3"},
            {key: "3t4"},
        ],
        frameRate: 3,
        repeat: -1
    });

    var f3w = this.anims.create({
        key: '3w',
        frames: [
            {key: "3w1"},
            {key: "3w2"},
            {key: "3w3"},
        ],
        frameRate: 3,
        repeat: -1
    });

    var f4t = this.anims.create({
        key: '4t',
        frames: [
            {key: "4t1"},
            {key: "4t2"},
            {key: "4t3"},
            {key: "4t4"},
        ],
        frameRate: 3,
        repeat: -1
    });

    var f4w = this.anims.create({
        key: '4w',
        frames: [
            {key: "4w1"},
            {key: "4w2"},
            {key: "4w3"},
        ],
        frameRate: 3,
        repeat: -1
    });

}

function update () 
{

    if (state == 1) {
        for(var i = 0; i<4; i++){
            if (currentlyTyping[i]) {
                players[i].play(((i%4)+1) + "w", true);
            } else {
                players[i].play(((i%4)+1) + "t", true);
            }
        }
    }

    if (!(element.node == document.activeElement)){
        element.node.focus();
    }
    
    
    timertext.text = "Time left: " +  secondsToText(timeleft);

    if (state == 1 || state == 0 || state == 5) {
        wordtext.text = "Word count: " + currentWordCount;
    }

    if (timeleft <= 0 && state == 1){
        
        state = 2;
        element.node.style.visibility = "hidden";
        statetext.text = "Feedback loading!";
        timeleft = -2;
        socket.send('{"action":"donewriting", "data":"' + currentText + '"}')
        wordtext.visible = false;
        for (var i = 0; i<4; i++){
            players[i].anims.stop();
        }
        if (predone){
            startFeedback();
        }
    }

    if (timeleft <= 0 && state == 3) {
        state = 4;
        alert('{"action":"donefeedback", "data":"' + feedbackinput.node.value + '"}');
        socket.send('{"action":"donefeedback", "data":"' + feedbackinput.node.value + '"}');
        if (prefeedbacktext) {
            endFeedback();
        }
    }

}
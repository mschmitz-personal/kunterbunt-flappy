
// *****************************************************************
// Global Variables
// *****************************************************************

// Constants influencing game behavior
var STARTING_WALL_GAP       = 150;
var STARTING_WALL_DISTANCE  = 250;
var STARTING_WALL_SPEED     = 3.5; 
 
var DIFFICULTY_ADJUSTMENT_SPEED     = 1.2;
var DIFFICULTY_ADJUSTMENT_GAP       = 0.85;  
var DIFFICULTY_ADJUSTMENT_DISTANCE  = 0.85;  

// Objects related to drawing and animation
var canvas;     // canvas used to draw on
var ctx         // context of canvas
var raf;        // animation frame

// Objects representing entities in te game (plane, walls, messenges, scores etc)
var plane;      // object representing the plane of the player
var messageMgr; // Message Manager to handle queue of messages
var wallMgr;    // Wall Manager to handle queue of walls

// Game status
var score;      // object representing the current score 
var hiscore;    // object representing the hiscore since starting
var playing;    // boolean (true if currently playning)



// *****************************************************************
// Global functions
// *****************************************************************
function init_game() {
    // init canvas for drawing
    canvas = document.getElementById('canvas');
    canvas.focus();                             
    ctx = canvas.getContext('2d');

    // reset game elements, including hiscore (reset_hiscore=true)
    reset_game(true);

    // init start status, we ar enot playing yet, but haning in the welcome screen
    playing = false;

    var message1 = new Message("Welcome to Kunterbunt's Flappy!",160,100,0,'24px serif'); // setting TTL ndless
    var message2 = new Message("Press <RETURN> key to start",160,130,0,'12px serif');
    messageMgr.add(message1);
    messageMgr.add(message2);

    // add event handlers
    canvas.addEventListener('mouseover', canvas_on_mouseover);
    canvas.addEventListener('mouseout', canvas_on_mouseout);
    canvas.addEventListener('keydown', canvas_on_keydown);

    // draw it for the first time
    draw_scene();
}

function reset_game(reset_hiscore) {
    plane = new Plane(80,100);
    score = new Score("Score:", canvas.width - 100, 30);

    if(reset_hiscore) {
        hiscore = new Score('Hiscore:', canvas.width - 220, 30);
    }

    messageMgr = new MessageMgr();
    wallMgr = new WallMgr();

    wallMgr.distance = STARTING_WALL_DISTANCE;
    wallMgr.gap      = STARTING_WALL_GAP;
    wallMgr.speed    = STARTING_WALL_SPEED;
}

function draw_scene(){
    // clear all
    ctx.clearRect(0,0, canvas.width, canvas.height);

    // draw walls
    wallMgr.draw();

    // draw plane
    plane.draw();

    // draw score and hiscore
    score.draw();
    if (hiscore.value > score.value) {
        hiscore.draw();
    }

    messageMgr.draw();
}

function process_scene() {
    
    wallMgr.process();                              // do we need to remove some walls, shall we add some walls?
    plane.move();                                 // move all objects in the scene
    wallMgr.process_scores(plane,score,hiscore);    // check, if we need to increase the score
    messageMgr.age();                               // remove any message, which exceeded time to live

    // check for collisions
    canvas_collision = plane.check_canvas_collision();
    wall_collision = wallMgr.check_collision(plane);
  
    // any collision ends the game
    if(canvas_collision || wall_collision) {
        plane.crashed = true;
        stop_playing();
    } else {
        adjust_difficulty();
        raf = window.requestAnimationFrame(process_scene);
    }

    draw_scene();
}

function adjust_difficulty() {
    // if we just started or the score was already processed, then leave it as is
    if(score.value == 0 || score.processed) {
        return;
    }

    // every 30 narrow the gap
    if( score.value % 30 == 0) {
        var message = new Message("Too easy? Lets narrow up!");
        messageMgr.add(message);

        wallMgr.gap = wallMgr.gap * DIFFICULTY_ADJUSTMENT_GAP;
        score.processed = true;
        return;
    }

    // every 15 narrow the distance
    if( score.value % 15 == 0) {
        var message = new Message("Still for dummies? We need more walls!");
        messageMgr.add(message);

        wallMgr.distance = wallMgr.distance * DIFFICULTY_ADJUSTMENT_DISTANCE;
        score.processed = true;
        return;
    }

    // every 5 increase speed by 20%
    if( score.value % 5 == 0) {
        var message = new Message("Boring? Lets speed up!");
        messageMgr.add(message);

        wallMgr.speed = wallMgr.speed * DIFFICULTY_ADJUSTMENT_SPEED;
        score.processed = true;
        return;
    }
}

function start_playing() {
    playing = true;
    reset_game(false);  // false = do not reset hi score

    var message = new Message("Press <SPACE> to control plane!");
    messageMgr.add(message);

    raf = window.requestAnimationFrame(process_scene);   // start animation
}

function stop_playing() {
    playing = false;

    messageMgr.clear();
    var message = new Message("Press <RETURN> to retry!");
    messageMgr.add(message);

    window.cancelAnimationFrame(raf);
}

// on mouseover: start animation
function canvas_on_mouseover(e) {
    canvas.focus();                             
} 

// on mouseout: stop animation
function canvas_on_mouseout(e) {
    stop_playing();
}

// on mousedown: accellerate plane upwards or start game, depending on status
function canvas_on_keydown(e) {
    if(playing && e.code == "Space") {
        plane.accellerate(-4);
    } 
    
    if (!playing && e.code == "Enter") {
        start_playing();
    }
}
  

// init game & draw initial screen
init_game();

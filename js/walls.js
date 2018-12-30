
class Wall {
    constructor(y1,y2) {
        // wall starts by default at end of canvas and moves left
        this.x1 = canvas.width-10;  
        this.y1 = y1;
        this.x2 = canvas.width;
        this.y2 = y2;
        this.color = 'red';
        this.scored = false;  // Wall was not scored yet
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x1, this.y2);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineTo(this.x2, this.y1);
        ctx.moveTo(this.x1, this.y1);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    move(speed) {
        // apply accelration
        this.x1 -= speed;
        this.x2 -= speed;
    }

    contains(x,y) {
        return this.x1<=x && x<=this.x2 && this.y1<=y && y<=this.y2 ;
    }
}

class WallMgr {
    constructor() {
        this.walls = [];
        this.distance=200;     // distance between walls (x)
        this.gap=50;           // gap in wall (y)
        this.speed=3;          // speed of walls
    }

    add(wall) {
        this.walls.push(wall);
    }

    clear() {
        this.walls = [];
    }

    draw() {
        for (var i = 0; i < this.walls.length; i++) {
            this.walls[i].draw();
        }    
    }

    process() {
        // 1) shall we add some walls?
        if ( this.walls.length == 0) {
            // if no walls yet, then add a new one for sure!!
            this.add_random_walls(); 
        } else {
            // if we have walls, then check that we leave enough distance to last wall
            var last_wall = this.walls[ this.walls.length - 1];
            if (last_wall.x2 < canvas.width - this.distance) {
                this.add_random_walls();
            }
        }
    
        // 2) lets move the existing walls towards the plane
        for (var i = 0; i < this.walls.length; i++) {
            this.walls[i].move(this.speed);
        }
    
        // remove any wall, which reached the beginning of the canvas
        this.walls = this.walls.filter( function(value, index, ass) {
            return value.x2 > 0;
        })
    }

    add_random_walls() {
        var y1 = Math.random() * (canvas.height - this.gap);
        var y2 = y1 + this.gap;
    
        var wall1 =  new Wall(0, y1);
        var wall2 =  new Wall(y2, canvas.height);
        
        this.add(wall1);
        this.add(wall2);
    
        // little hack, do not consider the lower wall for scoring to avoid double scores
        wall2.scored = true;
    }

    // ToDo: ugly! wallMgr knows about internals of planes and planes about walls
    check_collision(plane) {
        for (var i = 0; i < this.walls.length; i++) {
            var wall = this.walls[i];
            var wall_collision = plane.check_wall_collision(wall);
            if (wall_collision) {
                return true;
            }
        }    

        return false;
    }

    // ToDo: very ugly!! wallMgr knows about internals of score, hiscore and places
    process_scores(plane, score, hiscore) {
        for (var i = 0; i < this.walls.length; i++) {
            var temp_wall = this.walls[i];
            if (plane.check_wall_passed(temp_wall) && !temp_wall.scored) {
                score.increase();
                temp_wall.scored = true; // do not score this wall again!
            }
        }
    
        // see if the hiscore was broken
        if (score.value > hiscore.value) {
            hiscore.value = score.value;
        }
    }
}

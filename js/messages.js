class Message {
    constructor(text, x=180, y=130, time_to_live=90, font = '24px serif', color='black') {
        this.text = text;
        this.x = x;
        this.y = y;
        this.ttl = time_to_live;
        this.font =  font;
        this.color = color;
        this.time = 0;
    }

    draw() {
        // only show message if time to live was not exceeded or not specified
        if (this.alive()) {
            ctx.font = this.font;
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.x, this.y);    
        }
    }

    alive() {
        // message is considerd alive (ie to be displayed), if ttl is not specified or not exceeded
        return (this.ttl == 0) || (this.ttl > this.time);
    }

    age() {
        this.time = this.time + 1;
    }
}

class MessageMgr {
    constructor() {
        this.messages = [];
    }

    add(message) {
        this.messages.push(message);
    }

    clear() {
        this.messages=[];
    }

    draw() {
        // draw each message
        for (var i = 0; i < this.messages.length; i++) {
            this.messages[i].draw();
        }
    }

    age() {
        // age each message and check if still alive or remove from message queue
        this.messages = this.messages.filter( function(value, index, ass) {
                value.age();
                return value.alive();
        })
    }
}

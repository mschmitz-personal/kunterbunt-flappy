class Score {
    constructor(text, x, y) {
        this.color = 'black';
        this.font = '24px serif'
        this.value = 0;
        this.x = x;
        this.y = y;
        this.text = text;
        this.processed = false;
    }

    draw() {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text + this.value, this.x, this.y);
    }

    increase() {
        this.value += 1;
        this.processed = false;
    }

    reset() {
        this.value = 0;
        this.processed = false;
    }
}

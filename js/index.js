
// *****************************************************************
// Global Variables
// *****************************************************************
var canvas;     // canvas used to draw on
var ctx         // context of canvas
var raf;        // animation frame

var myplane;    // object representing the plane of the player
var myscore;    // object representing the current score 
var myhiscore;  // object representing the hiscore since starting
var mywalls;    // array of wall objects
var mymessages; // array of messages

var playing;         // boolean (true if currently playning)
var wall_distance;   // distance between walls (x)
var wall_gap;        // gap in wall (y)
var wall_speed;      // speed of walls

var testimage;


// *****************************************************************
// Classes
// *****************************************************************
class Message {
    constructor(text, x, y, time_to_live) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.ttl = time_to_live;
        this.font =  '24px serif';
        this.color = 'black';
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

    move() {
        // apply accelration
        this.x1 -= wall_speed;
        this.x2 -= wall_speed;
    }

    contains(x,y) {
        return this.x1<=x && x<=this.x2 && this.y1<=y && y<=this.y2 ;
    }
}

class Plane {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.vy = 2;
        this.crashed = false;

        // images
        this.image_normal = new Image();   
        this.image_normal.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAApCAYAAABp50paAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAABJJSURBVGhD7VkJeFXVtf7vkHuT3MxzyEAShhAS5hkMQQGBPsZGHApUBFRkEi2FFvr8fA9sURFUoOBYSp8iiiCIgAQIEECmJCAJGcw8kpDcTHcezu5a5yYPyHu0orSfX7/+8H/nnHv2Pmevvdde618nCvxzoSRODPD2nj1o4MChfoGBIXaz2XQ9Pz+vsLT0S7r3J2ITN/xXQHh0ly7p72zdKswGg3A2NwtnY6MQVquQnE5x4cwZMXHcuAZqN9XV/J8DXgHm/YZ//6Sk/MqCAnHjD38Q5T17ijqFQpgGDBCG6dNF86pVwkgGs+EvLl3qoPZTXN3+cXAjbicaiG3ENOIcopb4o+Hh7v7elaNHRWZiorgKiFJiI7FNqRSNCQmiZtIkUTRliqjYsEE4bDYxLiXlBnXzdPX+x2Be335JInZ0lNiR9YFYvWm1COkVKuj3MuJjxB+z10Nmzphhzxg5UqSTkZeJecSSdvJ5pkolzgQHi8NhYeLaunXiqwMH+N2/dHW/v+hw34EzH03FY4/EY//J/Xj6mWdQcLUAc96c29UtWPMJ3f+KGCG3vHekJCgU6tpz52CmC4ufH6Rhw9CgUKCerquINU4n6m7eRP2NGzi/cSOGDxkClUIxnDvfb3QYbLVabfj5wnjkfnEeU07MxCvXX8XEGQ9g9M7B8J8QPInWmLwRk1zN7wlxyqoqGOmkldjn1Cn0Pn8euiVLcIquf+frid93DcS7dJ5FLNProS8uhtrNzY8u7ztU7ccB8fE9x42aFoCwCBW+3FmIish6nK7JhK+HBt1Hh8IarPFsyWp+Ag5hpfZnXd2+F1IGarVjNU1NcNJFwqJF8AgNRd6RI9hkaMH013+DXy6ajH6pDyDbx4xjre44TgGspKLiJDU/LD/hPqLD4Ei1Wv1IXEIQoDEga1c5rN09IalVaGyzw2kHeiQEQJ3ko9BnNo0TZmcY9TlC5L329xAfJUlT1Var3Djvk09QdOAAdn3+OcZvXo+u/UbCHp2CRoc3/AO0GJq6AD4+vpVn09J+Rc3Z6+8rOgxW65v0C3v27IGq6grE9vDDxX0V0PTzk41tMznRYnQgNsoHnoMC0HBFP1hqc8RRvwPEv2e0pLPZFvrTiYZosVigr6wEJ9y2HrGIio+F3i8GGq0O4aFRUFN4rM4rMH2Tns4ihJvdV3QY3Co5pVXbP16j7PWQEf2Tw9Cc14a8myYofDWQKDOazQKNLXZEh+rg1T8IN6809hUGRxfqe9D1iLuinvbvI70oWrNLuxM55JMvoezMBXz0dRrarmXCUl4IP39veOp0KMvJt1w4dSqBmgwgMiiT3R90BC2zJEnXci/VtV8C89cMgPJEA5wWASftWqcNMBolfFtqpIG5o+eyPlD4axdQ01WuHneF1Ay8QOlI4s1P+RfkNDL6EBPKqvHEg4l4ccYQeJVexbPJ42p3bt6cO+/FF5Myrl599KW1az8PCAk5Q027y51+AMi2CcRufH67qjp/9Xwlzb5avvCilX32uUSYzjTCQcaywXw0kdHXSowICdEhai4tgptyHTUfLXe6O9IoxG86RycmIvspU08MJmZm7EWY/SjyLx9w6puaFzTr9S+3CnGjR2KiYdXq1eb0y5fDuvfqxQEsknhPIEN1QogFdHyYr28XFL8I7xL+UeJw2rewyD8ISeDc6VpoFpJhFMDYtQX5pUT0cVcjIdITWQfKYThUUkzNecFYmXFACyGy1/LWvUQ0k4q4+DPAbxNdsJQLJPLUkqSS8hXYRUNpoIFxAXGc+PC4ZcuWv7Vxo4r2vZZkoEfe9euYMWxYvcVsnk33OcN9n4AJu93+H0ql8il6tqdKpZp+u8ERnjqPyhz9DoVew+90ITujFotWXoQ6JVI2VKIAJt00QxD97TQ1tM+NhXKBY1GoFe4qnQoKrQJx/nEIDw/HyZMnr/alPP8mMLSmd28kJSdjzzvvyJuykEizMYYOnJJvx9KxL7wwft6GDXkJQvTUAd7kXLalU6cOOnX4cDANnp2DJ/k7Iok1OYWzA7UQ7wCt7PPUPpVODQqFYvHtLl1tMprzsk7e2seM7kkB6OaQYP2qHLYPcmF/5yrU35QhTOFAQp9YpD47BS/tfQnvZb/n/kXlF9hfvB/Ljz0PzzBP7NmzB6mpqf3IX4bSHkbg7Nnos2kTZlFg4mgXLr8BAa6DjIE0qFcSEhLetjQ1jaBlNF9QKK6eVCjOfHT8eHXW2bMBGRkZiiNHjgQqNcqhixcvnjV37tx1SUlJh6gfD5zrgTs0OBnL3sY7ydfhcPD5HVi/aMkzIlt6QWz5+mciZVqMcNOqhGeCTox67gGx9tO14ljFcVFrrSVvl+hZd8Im2cSl1tNiVfFc0Wdrgpj95Gyq/qzi1VdfFd5eXqKHRiP+KyJCXKRx1BDHEsnvv9bpdK+NGjUqa8mSJdK2bdtEVFSUSJ43r3Gb0/ny6qysNwbOnHnSXaezbtmyRdTV1YmBYweKyBXR4sMPP2x/sxDFxcVi9OjR7OZvuUxxwel0vku8SMwl957YuSgYFt4l7HxszxBcyslD0PQQRE0OxeTEifhd93W04W81F/TP6DSgxlKOUnMhCozfIseYBbOTRSS9SAhcOVqDqIyuePftd3kvYffu3di1axdKaT8OoPu86Vk/Xhw0CAtXrcK+ffswffp0HDp0CEfOnbPZzOYGS2Nj+LRp0xRr1qxBS0sLZQ8SJks8YKRg8uCpZNAkyO9jXLt2Df369Wsj+9mBDHRUk0v/hc45Iw4lL/hdZ4NDidX+00JUiUtiERHgySJevhHgFoRgTTioE0xkVIOtTjaODb8byAdQVtyKoq1VmNX/caxcuZJdDLRKuHTpEgoLC1FFOru+vl4WJHzPw8MDoSQ9u3btir59+2LkyJFym+3vb8dR0wkkLoyRx1XUbITXBh2OHTwmj0l+nyRhCBUeWVlZj9PlbnqeL/22mc6bqQ2nplc7G7xGG+e5zndcIDxbJWgkBWivwN1fA59YTwQP8IObzpW27gVGCm5l2XpU7a9DvKMbRg4YwSuBuLg4kpE+0Gg0oEgqt7XZbGhoaJAnIzMzExm5Z1EX3oiYn3dBVIw3PChbMCpazahf24jraTlwc+Ny3oUVK1bgjTfe+IxOXzCbzVp6NusETgypNAFbbzeYN/R+H1+v4Q9MjIM/FYMn9pXCHKuG0l0J83cmOOsdeGjbQPh0pbj5A2BzStAbbKjPbYE+pxWWSjNURiW0koYkpQo2YYdNbYfkq4BnjAcCSdoGxXkhwNON0v3t8ZXSmcGK3FeKUXqwEN7e3u2/Ajt37sSSuU9SUIXwGzi44s233ioYPHjwBaoVJpHBezoMHk9L/tH0J5KDYwY6UfhtPc5m1cFvfjh0fbzkbC0sTpQsLYDvxDCEjg2Bh5uKqJRn3F2tpBXq7Cy34KS+5gYrrE122KkYcZidpNEl2tcSbJTrBQlolSc9x9cNXqHu8A31gBs982+hwWhD1sYC5P/5Crp04S3rwikqP+dMHoOKR6nW9hmO87EzUAP3svnz5192d3fP4lFOp5PPxkzqq04YqUFB/k2ct5jgPSEYlFdBoRdOvQ1Nu6thq7Ii5KVespt3hpuKXJ8mgI3X0mrYrjSjNr0eLd8Z4OPmhchYfzQ1tqKytQneQ73lfSecApKFnm9wwtHsgP0mTYjeDhU9y7e7F0KoUIkeH0YpzqP9LbfQaLIje/t3OLv+KPr04fDnAgeu5MF90TSX1qnnGIhe43E0z4baoJjrc+bM+Zg35Gubd/5aXW3KwB935MM+MghKrwAYSqksbLbBfr0Flot6uYgIfL4HJFKjEqmAznDQHbOZVq3EgJZPKhHnEYHlLz6GUdP84BHSgrQ9+djwx0wkbU5EFBUgbgqlHPAk6svBTaJzB6221UqVWamJKrJW1JxrQuGCciTO747YKXeqSokFOU0MB7wmqrV5ApkcuCx0L/8E7VHyGm2oQBLF6OyKip6Uh7kYw04PT/c5FhISqq7svjTz9FJBxkp6kvukmZFI27ubP9wopXuQWNT6UrOOOqsd7PKGA9UkjNuwfOV8TFkYCpOqiCIv8OmWHOzLr0av52MQ7X0r8t+BTj9x7C9vM6HmajNKlxZi/K5kKMmDeHKstBVqWqyo3luJj5/dhvj4eFcnAhufPGIEa1X4jx0LvwcfpKBpx1mFwrl85cq1/BomqT8MJbL44VXn31YjOVqJBJb3nUB3NTQPGpofNzpKVQYYPi5DyoBhCIhrpdXiuoiiM+3X41+UImRRFBJnRCLYgytiFzgFkU6RJ44N6QyTw4nvbrahfs8N6A83wW9F7/Y7t2A6UoPPlr+HmJiY9l9IW1KuHj1qFA0eiE1JQbcJE1BptcIcGVn81FNP/YmN48nk71XMDkyjyKc0naum/WsmOULudHsQoR42A5GD/bc34JXXgi1v/ydSnmQNVyE3qS5pxcqn0hH53z2RODQYXmo12iotKDlYi/rsJhgaLeSWZHSjBG2QGpEpwUhcEAu1hwoNZhvKbxhgzjeg8dM6eDwWJ1drncG6nvM2i5oOkNu2n9GEm0wop/fWazS181JTr9FPzruFwhkhISEguYduFh/yyVygiL8k3yYyyK1wrASJRh98fXErhj9Z/7/GXjpRjaefOAoxOxx9BoXCg5ymLOMmmi4ALy94DWdPXURhfiHG/H4kdnywA0WXSzE5/FFcWF+A6+QthTnNMOQZUf9uJdT9KKZE+8gGd6aC1kKr1cpGMknGyivMcWEn8UObrTFi0KAzzz333Ie+vr7R9JN0NxXhyQEgMDAQ1ND1sOsW3Mi6DvSn6i+C8t7RYvQKioRvuB2/WfESLTpNBv0vyG6AuZsnohZ3Q49wL6hIvDRbbQgf5Y9Q70AoA80oNl7D2ebjKEyrQOr7qfIKlZaWwpED1O6pg6QVaD1Mx0AvaEZFwn7DBnW9q2R1kAiS/Nzld3k73ClQmmEwGFgzywGroqKCb9WXA+Oy09NbaPwvUTcO81yq2u+2wmeMRiMuXLiA4OBgkJaVZzJITZv2ZJkJH1/DghkzcTDnV3j76EPY9OUEvL5nPIK6eMIyPABRFFW7B9GkOBTySgiHEnW1VtQ26bG7fAd2lGxFzs3riFZ2lZ/b3NwsB5tZj8/CRHUyeuSHY0T8UIzqNgBD8vwxIN8Pzyc8ijmh46A91SRvJd5SoVp/WZLyhLGxDCoi+JBNvObn58d1K39VUtMC0kjQdDeD3ye9+y0VzFzP4sCBA3LIb21t5S80RbNmP47fbk9GszJTbtxYZ8aiKUdwQuFEyPgIxPp6ymmjw/U0DhUkqvTP/k8FrtB+L7lhQSnRzaGRB8gG6/V65Ofno6SkBKQLXLQqZBoam+XJz8nJgUXPtT/B6kBUUHuBeRtOnz7NB/7DAY/ZSBPB+SSIgqSa2NYpGdwBdoF1JMmmUkcNzSI/aTulsLTC2uOKG95/5gyGvMwGrHz6FAxjwqAKckeEn1aOb1YSLBZKb2azg1aB0hzV1FKrDZaDlQhcEQ8FKbPIE+7Y8ttNoHdg1qxZ8ktZU7PxrI955fiaIzpvLV6AKlUbWkdQmqxuxeKYhzFx4kS5HyM9PR0bN27kurgHkUMquzqXU/xXDHcyfvnfMvh2cDuOWCxa8/oP6h3hE+qEu06Bk4co1yb4Q+FF4YAtZYnZ0ZqEBAc3YaPMb3SQFjfDrZs3tIOp5qc26ktGfLDibZDryYPd+t52GJpaEB0VLRs3depUZGdnIzc3V96jdeHUaQjJSJ7pzBqsnb5I9jz2jG+++Ya9hf9y8wtiBlEG9XuZDlwa+tAELuOh3Sv4C0UKkQUsl5P87YrLWgrncnDgZMtuxJuK9w0XyM3EcKW/dowqzlulDNJC4aGmlGTF5OCRCAoK4pIOl69mIcSfHwds3rwZr7/+OsaPH4+0tDR5jxdXUyjigEWyktQEWSPxs4uI/N3sayJ/E3OJgHbQqi4kD+HvYFwiPvtDDP4xYH04gcjilyeLwR8wedA8KWPCwsLm8mquX78ey5YtkwNmbW0tKisrUVRUxBFpOZH/IkHWy199byXe/wdUbj5A3vJrMlrR+SPeTwG9dTpdLn8AYB3ALs1pZu/evXLNXFVVtY3aLHI1/X4gQ1W0yp/S8TDFivd/agYz/kIGz/by8gKnRg5eHNRohZtID/BfInhl7wlkbDSxkQKg6/vTTwz8bXsb5We7v7+/IIkraO+xLBwk3/0XBn+rTyb+36rh3/g37gLgr8XRQt+NWHSOAAAAAElFTkSuQmCC';

        this.image_crashed = new Image();   
        this.image_crashed.src = 'data:image/png;base64,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';
        
        this.image = this.image_normal; // used for boundary checks etc
    }

    draw() {
        if(this.crashed) {
            ctx.drawImage(this.image_crashed, this.x, this.y);
        } else {
            ctx.drawImage(this.image_normal, this.x, this.y);
        }
    }

    accellerate(new_vy) {
        this.vy = new_vy;
    }

    move() {
        // apply acceleration  
        this.y += this.vy;
  
        // simmulate gravity
        this.vy *= 0.99;
        this.vy += 0.25;
    }

    check_canvas_collision() {
        if ( (this.y + this.image.height > canvas.height) || (this.y < 0)) {
            return true;
        }
        if ( (this.x + this.image.width > canvas.width) || (this.x < 0)) { 
            return true;
        } 

        return false; // no collision
    }

    check_wall_collision(wall) {
        var x_sensitivity = this.image.width * 0.1
        var y_sensitivity = this.image.height * 0.1

        // build bounding box
        var x1 = this.x + x_sensitivity;
        var x2 = this.x + this.image.width - x_sensitivity;
        var y1 = this.y + y_sensitivity;
        var y2 = this.y + this.image.height - y_sensitivity;

        // check for overlap with coordinates of wall
        if(wall.contains(x1,y1) || wall.contains(x1,y2) || wall.contains(x2,y1) || wall.contains(x2,y2)) {
            return true;
        }

        return false;
    }
}





// *****************************************************************
// Global functions
// *****************************************************************
function init() {
    // init canvas for drawing
    canvas = document.getElementById('canvas');
    canvas.focus();                             
    ctx = canvas.getContext('2d');

    // reset game elements
    reset();

    // hiscofr is not resetted, so it is initialized here!
    myhiscore = new Score('Hiscore:', canvas.width - 220, 30);

    // init start status
    playing = false;

    var message1 = new Message("Welcome to Kunterbunt's Flappy!",150,100,0);
    var message2 = new Message("Press <RETURN> key to start",150,130,0);
    message2.font =  '12px serif';
    mymessages.push(message1);
    mymessages.push(message2);


    // add event handlers
    canvas.addEventListener('mouseover', canvas_on_mouseover);
    canvas.addEventListener('mouseout', canvas_on_mouseout);
    canvas.addEventListener('keydown', canvas_on_keydown);
}

function reset() {
    myplane = new Plane(80,100);
    myscore = new Score("Score:", canvas.width - 100, 30);
    mywalls = [];
    mymessages = []; 

    wall_distance = 250;
    wall_gap = 150;
    wall_speed = 2.5;
}

function draw_scene(){
    // clear all
    ctx.clearRect(0,0, canvas.width, canvas.height);

    // draw walls
    for (var i = 0; i < mywalls.length; i++) {
        mywalls[i].draw();
    }

    // draw plane
    myplane.draw();

    // draw score and hiscore
    myscore.draw();
    if (myhiscore.value > myscore.value) {
        myhiscore.draw();
    }

    // draw all messages
    for (var i = 0; i < mymessages.length; i++) {
        mymessages[i].draw();
    }
}
 
function add_random_walls() {
    y1 = Math.random() * (canvas.height - wall_gap);
    y2 = y1 + wall_gap;

    wall1 =  new Wall(0, y1);
    wall2 =  new Wall(y2, canvas.height);
    mywalls.push(wall1);
    mywalls.push(wall2);

    // little hack, do not consider the lower wall for scoring to avoid double scores
    wall2.scored = true;
}

function process_walls() {
    // 1) shall we add some walls?
    if ( mywalls.length == 0) {
        // if no walls yet, then add a new one for sure!!
        add_random_walls(); 
    } else {
        // if we have walls, then check that we leave enough distance to last wall
        last_wall = mywalls[ mywalls.length - 1];
        if (last_wall.x2 < canvas.width - wall_distance) {
            add_random_walls();
        }
    }

    // 2) lets move the existing walls towards the plane
    for (var i = 0; i < mywalls.length; i++) {
        mywalls[i].move();
    }

    // remove any wall, which reached the beginning of the canvas
    mywalls = mywalls.filter( function(value, index, ass) {
        return value.x2 > 0;
    })
}

function process_scores() {
    for (var i = 0; i < mywalls.length; i++) {
        temp_wall = mywalls[i];
        if (temp_wall.x2 < myplane.x && !temp_wall.scored) {
            myscore.increase();
            temp_wall.scored = true; // do not score this wall again!
        }
    }

    // see if the hiscore was broken
    if (myscore.value > myhiscore.value) {
        myhiscore.value = myscore.value;
    }
}

function process_messages() {
    // age each message and check if still alive
    mymessages = mymessages.filter( function(value, index, ass) {
        value.age();
        return value.alive();
    })
}    

function adjust_difficulty() {
    // if we just started or the score was already processed, then leave it as is
    if(myscore.value == 0 || myscore.processed) {
        return;
    }

    // every 30 narrow the gap
       if( myscore.value % 30 == 0) {
        var message = new Message("Too easy? Lets narrow up!", 150,100,60);
        mymessages.push(message);

        wall_gap = wall_gap * 0.85;
        myscore.processed = true;
        return;
    }

    // every 15 narrow the distance
       if( myscore.value % 15 == 0) {
        var message = new Message("Still for dummies? We need more walls!", 150,100,60);
        mymessages.push(message);

        wall_distance = wall_distance * 0.85;
        myscore.processed = true;
        return;
    }

    // every 5 increase speed by 20%
    if( myscore.value % 5 == 0) {
        var message = new Message("Boring? Lets speed up!", 150,100,60);
        mymessages.push(message);

        wall_speed = wall_speed * 1.2;
        myscore.processed = true;
        return;
    }

 
}

function process_scene() {
    
    process_walls();       // shall we add some walls?
    myplane.move();         // move all objects in the scene
    process_scores();   // check, if we need to increase the score
    process_messages()     // remove any message, which exceeded time to live

    // check for collisions
    canvas_collision = myplane.check_canvas_collision();
    for (var i = 0; i < mywalls.length; i++) {
        wall_collision = myplane.check_wall_collision(mywalls[i]);
        if (wall_collision) {
            break;
        }
    }
  
    // any collision ends the game
    if(canvas_collision || wall_collision) {
        myplane.crashed = true;
        stop_game();
    } else {
        adjust_difficulty();
        raf = window.requestAnimationFrame(process_scene);
    }

    draw_scene();
}

function start_game() {
    playing = true;
    reset();

    var message = new Message("Press <SPACE> to control plane!",150,130,60);
    message.font =  '24px serif';
    mymessages.push(message);

    raf = window.requestAnimationFrame(process_scene);   // start animation
}

function stop_game() {
    playing = false;

    mymessages = [];  // get rid of old messages
    var message = new Message("Press <RETURN> to retry!",150,130,0);
    message.font =  '24px serif';
    mymessages.push(message);

    window.cancelAnimationFrame(raf);
}

// on mouseover: start animation
function canvas_on_mouseover(e) {
    canvas.focus();                             
} 

// on mouseout: stop animation
function canvas_on_mouseout(e) {
    stop_game();
}

// on mousedown: accellerate plane upwards or start game, depending on status
function canvas_on_keydown(e) {
    if(playing && e.code == "Space") {
        myplane.accellerate(-4);
    } 
    
    if (!playing && e.code == "Enter") {
        start_game();
    }
}
  

// draw initial screen
init();
draw_scene();
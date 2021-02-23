class GameView {
    constructor(canvas) {
        this.canvas = canvas;
    }

    draw(img) {
        let ctx = this.canvas.getContext('2d');
        var hRatio = this.canvas.width / img.width;
        var vRatio = this.canvas.height / img.height;
        var ratio = Math.min(hRatio, vRatio);
        var centerShift_x = (this.canvas.width - img.width * ratio) / 2;
        var centerShift_y = (this.canvas.height - img.height * ratio) / 2;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            centerShift_x,
            centerShift_y,
            img.width * ratio,
            img.height * ratio
        );
    }

    clear() {
        let ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class UserView {
    constructor(name, canvas) {
        this.name = name;
        this.canvas = canvas;
        this.text = 'push ready button!!';
        this.state = 'init';
    }

    setText(text) {
        this.text = text;
        this.draw();
    }

    setScoreData(dataMap) {
        this.dataMap = dataMap;
        this.draw();
    }

    setKeyPoints(keyPoints) {
        this.keyPoints = keyPoints;
    }

    draw(state) {
        if (this.canvas == null) {
            console.log('draw failed');
            return;
        }        
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawText(ctx);
        if (state == 'playing') {
            this.drawScore(ctx);
            //this.drawSkeleton(ctx);
        }
    }

    drawText(ctx) {
        if (this.text == null)
            return;
        ctx.font = 'bold 20px Courier';
        ctx.fillStyle = "red";
        ctx.textAlign = 'center'
        ctx.fillText(this.text, this.canvas.width/2, this.canvas.height/2);
    }

    drawScore(ctx) {
        if (this.dataMap == null)
            return;
        ctx.font = 'bold 12px Courier';
        ctx.fillStyle = "red";
        ctx.textAlign = 'left'    
        let x = 5;
        let y = this.canvas.height/6;
        this.dataMap.forEach((value, key, map) => {
            ctx.fillText(key, x, y);
            ctx.fillText(value.score.toString(), x, y + 12);
            y += 30;
        });
    }

    drawSkeleton(ctx) {
        if (this.keyPoints == null)
            return;

        let w = 5;
        let h = 5;

        ctx.beginPath();
        for (let i = 0; i < skeleton.length; i++) {
            ctx.moveTo(
                this.keyPoints[skeleton[i][0]][0],
                this.keyPoints[skeleton[i][0]][1]
            );
            ctx.lineTo(
                this.keyPoints[skeleton[i][1]][0],
                this.keyPoints[skeleton[i][1]][1]
            );
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgb(66, 135, 245)';
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = 'rgb(255, 102, 0)';
        for (let i = 0; i < keyPoints.length; i++) {
            ctx.beginPath();
            ctx.ellipse(
                this.keyPoints[i][0],
                this.keyPoints[i][1],
                w,
                h,
                0,
                0,
                2 * Math.PI
            );
            ctx.fill();
            ctx.closePath();
        }
    }

    clear() {
        let ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class PoseMatchViewManager {
    constructor(gameCanvas) {
        this.viewMap = new Map();
        this.gameView = new GameView(gameCanvas);

        this.timerId = setInterval(function(viewer) {
            viewer.draw();
        },
        1000,
        this);
    }

    getGameView() {
        return this.gameView;
    }

    getUserView(name) {
        return this.viewMap.get(name);
    }

    addUserView(name, canvas) {
        this.viewMap.set(name, new UserView(name, canvas));
    }

    readyUser(name) {
        console.log('ready:', name, this.viewMap.get(name));
        this.viewMap.get(name).setText('Ready');
    }

    clearAll() {
        this.viewMap.forEach((value, key, map) => {
            value.setText(null);
            value.clear();
        });
    }

    setState(state) {
        this.state = state;
        if (this.state == 'readyAll') {            
            this.clearAll();
        }
    }

    setScoreData(name, dataMap) {
        this.viewMap.get(name).setScoreData(dataMap);
    }

    setKeyPoints(name, keyPoints) {
        this.viewMap.get(name).setKeyPoints(dataMap);
    }

    draw() {
        this.viewMap.forEach((value, key, map) => {
            value.draw(this.state);
        });
    }
}

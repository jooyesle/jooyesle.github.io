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

    draw(state) {
        if (this.canvas == null) {
            console.log('draw failed')
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

    setScoreData(name, dataMap) {
        this.viewMap.get(name).setScoreData(dataMap);
    }

    draw() {
        this.viewMap.forEach((value, key, map) => {
            value.draw(this.state);
        });
    }
    setState(state) {
        this.state = state;
        if (this.state == 'readyAll') {            
            this.clearAll();
        }
    }
}
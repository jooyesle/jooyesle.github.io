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
        this.drawText('push ready button !!');
    }

    drawText(text) {
        if (this.canvas == null) {
            console.log('draw failed')
            return;
        }
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = 'bold 20px Courier';
        ctx.fillStyle = "red";
        ctx.textAlign = 'center'
        ctx.fillText(text, this.canvas.width/2, this.canvas.height/2);
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
        this.viewMap.get(name).drawText('Ready');
    }

    clearAll() {
        this.viewMap.forEach((value, key, map) => {
            value.clear();
        });
    }
}
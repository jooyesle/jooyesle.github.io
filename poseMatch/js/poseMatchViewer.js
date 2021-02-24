class GameView {
    constructor(canvas) {
        this.canvas = canvas;
    }

    draw(img) {
        let ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);
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
        if (this.text != text) {
            this.text = text;
            this.draw();
        }
    }

    setScoreData(dataMap) {
        if (this.dataMap != dataMap) {
            this.dataMap = dataMap;
            this.draw();
        }
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
            this.drawSkeleton(ctx);
        } else if (state == 'stop') {
            this.drawResult(ctx);
        }
    }

    drawText(ctx) {
        if (this.text == null) return;
        ctx.font = 'bold 20px Courier';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.canvas.width / 2, 25);
    }

    drawResult(ctx) {
        if (this.dataMap == null) {
            return;
        }
        ctx.font = 'bold 14px Courier';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'start';
        let x = this.canvas.width / 2 - 50;
        let y = 50;

        this.dataMap.forEach((value, key, map) => {
            ctx.fillText('[' + key + ']', x, y);
            let pose = 1;
            value.score.forEach((score) => {
                let text = pose.toString() + ':' + score;
                ctx.fillText(text, x, y + 14);
                y += 14;
                pose++;
            });
            y += 20;
        });
    }

    drawScore(ctx) {
        if (this.dataMap == null) {
            console.log('skip draw score');
            return;
        }
        ctx.font = 'bold 12px Courier';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'left';
        let x = 5;
        let y = this.canvas.height / 6;

        this.dataMap.forEach((value, key, map) => {
            ctx.fillText('[' + key + ']', x, y);
            let pose = 1;
            value.score.forEach((score) => {
                let text = pose.toString() + ':' + score;
                ctx.fillText(text, x, y + 12);
                y += 12;
                pose++;
            });
            y += 30;
        });
    }

    drawSkeleton(ctx) {
        if (this.keyPoints == null) return;

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
        for (let i = 0; i < this.keyPoints.length; i++) {
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

        this.timerId = setInterval(
            function (viewer) {
                viewer.draw();
            },
            250,
            this
        );
    }

    setMyName(name) {
        this.myName = name;
    }

    getGameView() {
        return this.gameView;
    }

    getMyUserView() {
        return this.viewMap.get(this.myName);
    }

    getUserView(name) {
        return this.viewMap.get(name);
    }

    addUserView(name, canvas) {
        this.viewMap.set(name, new UserView(name, canvas));
    }

    clearAll() {
        this.viewMap.forEach((value, key, map) => {
            value.setText(null);
            value.clear();
        });
    }

    setState(state, data) {
        if (this.state == state) return;

        if (state == 'ready') {
            this.viewMap.get(data).setText('Ready');
            return;
        } else if (state == 'readyAll') {
            this.clearAll();
        } else if (state == 'playing') {
            this.getMyUserView().setText(data);
        } else if (state == 'stop') {
            this.getMyUserView().setText('Result');
        }

        this.state = state;
        console.log('Viewer State:', this.state);
    }

    setScoreData(name, dataMap) {
        this.viewMap.get(name).setScoreData(dataMap);
    }

    setKeyPoints(name, keyPoints) {
        this.viewMap.get(name).setKeyPoints(keyPoints);
    }

    draw() {
        this.viewMap.forEach((value, key, map) => {
            value.draw(this.state);
        });
    }
}

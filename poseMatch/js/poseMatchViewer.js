class BaseView {
    constructor(name, canvas) {
        this.name = name;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
    }

    draw() {}

    drawImage(img) {}

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class PoseView extends BaseView {
    constructor(name, canvas) {
        super(name, canvas);
        this.keyPoints = null;
        this.keyVectors = null;
    }

    setText(text) {
        if (this.text != text) {
            this.text = text;
        }
    }

    setKeyPoints(keyPoints) {
        this.keyPoints = keyPoints;
    }

    setKeyVectors(keyVectors) {
        this.keyVectors = keyVectors;
    }

    drawImage(img) {
        this.clear();
        if (img) {
            this.ctx.drawImage(img, 0, 0, img.width, img.height);
        }
    }

    drawText() {
        if (this.text == null) return;

        this.ctx.font = 'bold 20px Courier';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.text, this.canvas.width / 2, 25);
    }

    drawSkeleton() {
        if (this.keyPoints == null || this.keyVectors == null) return;

        let w = 5;
        let h = 5;
        let threshold = 0.86602540378; // +-30 deg
        // good posture
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#74C7B8';
        for (let i = 0; i < skeleton.length; i++) {
            if (this.keyVectors[i][2] >= threshold) {
                this.ctx.moveTo(
                    this.keyPoints[skeleton[i][0]][0],
                    this.keyPoints[skeleton[i][0]][1]
                );
                this.ctx.lineTo(
                    this.keyPoints[skeleton[i][1]][0],
                    this.keyPoints[skeleton[i][1]][1]
                );
            }
        }
        this.ctx.stroke();
        this.ctx.closePath();

        // bad posture
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#EF4F4F';
        for (let i = 0; i < skeleton.length; i++) {
            if (this.keyVectors[i][2] < threshold) {
                this.ctx.moveTo(
                    this.keyPoints[skeleton[i][0]][0],
                    this.keyPoints[skeleton[i][0]][1]
                );
                this.ctx.lineTo(
                    this.keyPoints[skeleton[i][1]][0],
                    this.keyPoints[skeleton[i][1]][1]
                );
            }
        }
        this.ctx.stroke();
        this.ctx.closePath();

        this.ctx.fillStyle = '#FFCDA3';
        for (let i = 0; i < this.keyPoints.length; i++) {
            this.ctx.beginPath();
            this.ctx.ellipse(
                this.keyPoints[i][0],
                this.keyPoints[i][1],
                w,
                h,
                0,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
            this.ctx.closePath();
        }
    }
}

class GameView extends PoseView {
    constructor(name, canvas) {
        super(name, canvas);
    }
}

class UserView extends PoseView {
    constructor(name, canvas) {
        super(name, canvas);
        this.text = 'push ready button!!';
        this.state = 'init';
    }

    setScoreData(dataMap) {
        if (this.dataMap != dataMap) {
            this.dataMap = dataMap;
        }
    }

    setState(state) {
        this.state = state;
    }

    draw() {
        if (this.canvas == null) {
            console.log('draw failed');
            return;
        }
        this.clear();
        if (this.state == 'playing') {
            this.drawScore();
            this.drawSkeleton();
        } else if (this.state == 'stop' || this.state == 'reset') {
            this.drawResult();
        }
        this.drawText();
    }

    drawResult() {
        if (this.dataMap == null) {
            return;
        }
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = 'bold 14px Courier';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'start';
        let x = this.canvas.width / 2 - 50;
        let y = 50;

        this.dataMap.forEach((value, key, map) => {
            this.ctx.fillText('[' + key + ']', x, y);
            let pose = 1;
            value.score.forEach((score) => {
                let text = pose.toString() + ':' + score;
                this.ctx.fillText(text, x, y + 14);
                y += 14;
                pose++;
            });
            y += 20;
        });
    }

    drawScore() {
        if (this.dataMap == null) {
            console.log('skip draw score');
            return;
        }
        this.ctx.font = 'bold 12px Courier';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        let x = 5;
        let y = this.canvas.height / 6;

        this.dataMap.forEach((value, key, map) => {
            this.ctx.fillText('[' + key + ']', x, y);
            let pose = 1;
            value.score.forEach((score) => {
                let text = pose.toString() + ':' + score;
                this.ctx.fillText(text, x, y + 12);
                y += 12;
                pose++;
            });
            y += 30;
        });
    }
}

class PoseMatchViewManager {
    constructor(gameCanvas) {
        this.viewMap = new Map();
        this.gameView = new GameView('gameview', gameCanvas);
        this.drawAll();
    }

    drawAll() {
        this.draw();
        setTimeout(
            function (viewer) {
                viewer.drawAll();
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

    clear() {
        this.viewMap.forEach((value, key, map) => {
            value.setText(null);
            value.clear();
        });
    }

    setTextRemoteUserViews(text) {
        this.viewMap.forEach((value, key, map) => {
            if (key != this.myName) {
                value.setText(text);
            }
        });
    }

    setState(state, data) {
        if (this.state == state && this.stateData == data) return;

        console.log('Viewer State:', this.state);
        if (state == 'ready') {
            this.viewMap.get(data).setText('Ready');
            return;
        } else if (state == 'readyAll') {
            this.clear();
        } else if (state == 'playing') {
            this.getMyUserView().setText(data);
        } else if (state == 'stop') {
            this.getMyUserView().setText('Result');
        } else if (state == 'reset') {
            this.setTextRemoteUserViews(null);
        }

        this.state = state;
        this.stateData = data;
        this.getMyUserView().setState(this.state);
    }

    setScoreData(name, dataMap) {
        this.viewMap.get(name).setScoreData(dataMap);
    }

    setKeyPoints(name, keyPoints) {
        this.viewMap.get(name).setKeyPoints(keyPoints);
    }

    draw() {
        this.viewMap.forEach((value, key, map) => {
            value.draw();
        });
    }
}

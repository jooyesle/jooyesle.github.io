class FaceImage {
    constructor(name, left, top, right, bottom) {
        this.img = new Image();
        this.img.src = name;
        this.gapLeft = left;
        this.gapTop = top;
        this.gapRight = right;
        this.gapBottom = bottom;
    }
    drawImage(canvas, faceData) {
        console.log('draw image');
        let ctx = canvas.getContext("2d");
        if (faceData != null && faceData.w > 50) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height, 
                faceData.x - this.gapLeft, faceData.y - this.gapTop, faceData.w + this.gapRight, faceData.h + this.gapBottom);
            ctx.closePath();
            console.log('draw image');
        }
    }
}

class FaceDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        this.images = [];
        this.images.push(new FaceImage('/src/smartscreen/images/face_iu.png', 18, 45, 40, 40));
        this.images.push(new FaceImage('/src/smartscreen/images/mickey.png', 18, 60, 55, 55));
        this.images.push(new FaceImage('/src/smartscreen/images/smile.png', 18, 42, 40, 45));
        this.data = null;
        this.timerId = null;
        this.selectedFaceIndex = 0;
    }

    selectFaceImage(index) {
        this.selectedFaceIndex = index;
    }

    updateFaceData(data) {
        this.data = data;
    }

    static startTimer(drawer) {
        drawer.draw();
    }

    start() {
        this.timerId = setInterval(FaceDrawer.startTimer, 250, this);
    }

    stop() {
        clearInterval(this.timerId);
        this.clearScreen();
    }

    clearScreen() {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        if (this.data == null) {
            return;
        }
        if (this.selectedFaceIndex == 0) {
            this.drawCircle();
        } else {
            this.images[this.selectedFaceIndex - 1].drawImage(this.canvas, this.data);
        }
    }

    drawCircle() {
        let ctx = this.canvas.getContext("2d");
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgb(255, 102, 0)";
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.beginPath();
        ctx.ellipse(
          this.data.x + this.data.w / 2,
          this.data.y + this.data.h / 2,
          this.data.w / 2,
          this.data.h / 2,
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        ctx.closePath(); 
    }
}

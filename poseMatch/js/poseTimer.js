class PoseTimer {
    constructor(targetView, data) {
        this.listeners = [];
        this.index = 0;
        this.targetView = targetView;
        this.data = data;
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    notifyToListener(cmd, data) {
        this.listeners.forEach((listener) => {
            listener(cmd, data);
        });
    }

    start() {
        if (this.timerId) {
            return;
        }
        console.log('Start PoseTimer');
        this.timerId = setInterval(
            function (poseTimer) {
                poseTimer.index += 1;
                if (poseTimer.data.has(poseTimer.index)) {
                    poseTimer.notifyToListener(
                        poseTimer.data.get(poseTimer.index).cmd,
                        null
                    );
                    if (poseTimer.data.get(poseTimer.index).cmd == 'stop') {
                        poseTimer.stop();
                        return;
                    }
                    poseTimer.targetView.drawImage(
                        poseTimer.data.get(poseTimer.index).img
                    );
                }
            },
            1000,
            this
        );
    }

    stop() {
        console.log('Stop PoseTimer:', this.timerId);
        clearInterval(this.timerId);
        this.timerId = null;
        this.targetView.clear();
        this.index = 0;
    }
}

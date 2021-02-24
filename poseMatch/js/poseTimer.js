class PoseTimer {
    constructor(targetView, data) {
        this.listeners = [];
        this.targetView = targetView;
        this.data = data;
        this.index = 0;
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
                if (poseTimer.data.has(poseTimer.index)) {
                    poseTimer.notifyToListener(
                        poseTimer.data.get(poseTimer.index).cmd,
                        null
                    );
                    if (poseTimer.data.get(poseTimer.index).cmd == 'stop') {
                        poseTimer.stop();
                        return;
                    }
                    poseTimer.targetView.draw(
                        poseTimer.data.get(poseTimer.index).img
                    );
                }
                poseTimer.index += 1;
            },
            1000,
            this
        );
    }

    stop() {
        console.log('Stop PoseTimer:', this.timerId);
        clearInterval(this.timerId);
        this.targetView.clear();
    }
}

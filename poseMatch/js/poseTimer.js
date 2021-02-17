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
        var msg = [cmd, data];
        //console.log('notification:', msg);
        this.listeners.forEach((listener) => {
            listener(msg);
        });
    }

    start() {
        console.log('[POSE] start timer');
        this.timerId = setInterval(
            function (poseTimer) {
                if (poseTimer.data.has(poseTimer.index)) {
                    if (poseTimer.data.get(poseTimer.index).cmd == 'stop') {
                        poseTimer.stop();
                        return;
                    }
                    //console.log(poseTimer.data.get(poseTimer.index));
                    poseTimer.targetView.draw(poseTimer.data.get(poseTimer.index).img);
                    poseTimer.notifyToListener(poseTimer.data.get(poseTimer.index).cmd, null);
                }
                poseTimer.index += 1;
            },
            1000,
            this
        );
    }

    stop() {
        console.log('[POSE] stop timer');
        clearInterval(this.timerId);
        this.targetView.clear();
    }
}
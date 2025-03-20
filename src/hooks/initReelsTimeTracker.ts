// Extend the Window interface to include overlayTimerInterval
declare global {
    interface Window {
        overlayTimerInterval?: ReturnType<typeof setInterval>;
    }
}

const isInReelsSection = (): boolean => {
    return (
        window.location.href.includes('/reels') ||
        window.location.href.includes('/reel') ||
        window.location.href.includes('/shorts')
    );
};

type TimeTrackerData = {
    startTime: number;
    totalTime: number;
    lastOverlayShown: number;
};

const getRemainingTime = (): number | null => {
    const timeData = localStorage.getItem('reelsTimeTracker');
    if (!timeData) return null;

    const data: TimeTrackerData = JSON.parse(timeData);
    const elapsedTime = (Date.now() - data.startTime) / 1000 / 60;
    const remainingTime = data.totalTime - elapsedTime;

    return remainingTime > 0 ? remainingTime : 0;
};

const startTracking = (totalTimeLimit: number): void => {
    const existingData = localStorage.getItem('reelsTimeTracker');

    if (existingData) {
        const data: TimeTrackerData = JSON.parse(existingData);
        if (getRemainingTime() <= 0) {
            localStorage.setItem(
                'reelsTimeTracker',
                JSON.stringify({ startTime: Date.now(), totalTime: totalTimeLimit, lastOverlayShown: 0 })
            );
        }
    } else {
        localStorage.setItem(
            'reelsTimeTracker',
            JSON.stringify({ startTime: Date.now(), totalTime: totalTimeLimit, lastOverlayShown: 0 })
        );
    }

    startOverlayTimer(totalTimeLimit);
};

const showOverlay = (remainingMinutes: number, isFinished: boolean = false): void => {
    let overlayDiv = document.getElementById('reels-time-overlay');
    if (overlayDiv) overlayDiv.remove();

    overlayDiv = document.createElement('div');
    overlayDiv.id = 'reels-time-overlay';
    overlayDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #3366ff;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    `;

    overlayDiv.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h2 style="font-size: 24px; margin-bottom: 20px;">Time to take control of your day.</h2>
        <div style="margin: 20px 0;">
          <div style="font-size: 50px; margin-bottom: 10px;">👩‍💻 🐶</div>
        </div>
        <div style="background-color: #ffcc00; color: black; width: 100px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto;">
          <span style="font-size: 24px; font-weight: bold;">${Math.round(remainingMinutes)}</span>
          <span style="font-size: 14px;">mins left</span>
        </div>
        <button id="overlay-close-btn" style="margin-top: 30px; padding: 10px 40px; background-color: black; color: white; border: none; border-radius: 20px; cursor: pointer;">Close</button>
      </div>
    `;

    document.body.appendChild(overlayDiv);

    document.getElementById('overlay-close-btn')?.addEventListener('click', () => {
        overlayDiv.remove();

        if (isFinished) {
            window.location.href = '/';
        }

        const timeData = JSON.parse(localStorage.getItem('reelsTimeTracker') || '{}');
        timeData.lastOverlayShown = Date.now();
        localStorage.setItem('reelsTimeTracker', JSON.stringify(timeData));
    });
};

const startOverlayTimer = (totalTimeLimit: number): void => {
    if (window.overlayTimerInterval) clearInterval(window.overlayTimerInterval);

    window.overlayTimerInterval = setInterval(() => {
        if (!isInReelsSection()) return;

        const remainingTime = getRemainingTime();
        console.log("remainingTime", remainingTime);
        if (remainingTime === null) return;

        const timeData = JSON.parse(localStorage.getItem('reelsTimeTracker') || '{}');
        const timeSinceLastOverlay = (Date.now() - timeData.lastOverlayShown) / 1000 / 60;

        if (remainingTime <= 0) {
            showOverlay(0, true);
            clearInterval(window.overlayTimerInterval);
            return;
        }

        const intervalTime = Math.min(3, totalTimeLimit / 3);
        if (timeSinceLastOverlay >= intervalTime) {
            showOverlay(remainingTime);
        }
    }, 10000);
};

const initReelsTimeTracker = (userTimeLimit: number = 2) => {
    if (!isInReelsSection()) return;

    console.log('Initializing reels time tracker');
    startTracking(userTimeLimit);

    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            if (isInReelsSection()) {
                startTracking(userTimeLimit);
            } else if (window.overlayTimerInterval) {
                clearInterval(window.overlayTimerInterval);
            }
        }
    });

    urlObserver.observe(document, { subtree: true, childList: true });

    return {
        getRemainingTime,
        showOverlayNow: () => showOverlay(getRemainingTime() || 0),
        resetTimer: () => {
            localStorage.removeItem('reelsTimeTracker');
            startTracking(userTimeLimit);
        },
    };
};

export default initReelsTimeTracker;

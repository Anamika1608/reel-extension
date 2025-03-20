import { useEffect, useState, useRef } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { sendToBackground } from "@plasmohq/messaging"
import { initMessageDetection } from "~hooks/initMsgDetection"
import { getToken } from "~utils/auth"
import decodeToken from "~hooks/decodeToken"
import initReelsTimeTracker from "~hooks/initReelsTimeTracker"

let areMessagesHidden = true


//populate this by calling-> GET: https://harassment-saver-extension.onrender.com/api/v1/user/blacklisted-keywords also the response is {"status":"success","data":{"keywords":["cool","marry","kill","love","date"],"total":5}}, isse populate the absuive words wala array and then it will work fine




export const initializeMessaging = async () => {
  try {
    const token = await getToken();
    if (!token) {
      // console.log("No token available");
      return null;
    }

    const response = await decodeToken(token);
    console.log("userid", response.userId);
    return response.userId || null;
  } catch (error) {
    console.error("Error initializing messaging:", error);
    return null;
  }
};


export const config: PlasmoCSConfig = {
  matches: ["https://www.instagram.com/*"]
}


const ContentScript = () => {
  const isTrackingInitialized = useRef(false); // Track if the tracker is already running

  useEffect(() => {
    let currentReelsTracker = null;

    const setupReelsTracking = async () => {
      try {
        const isInReels = window.location.href.includes("/reels");

        console.log("Current URL:", window.location.href);

        if (isInReels && !isTrackingInitialized.current) {
          console.log("Reels section detected, initializing tracker");
          currentReelsTracker = initReelsTimeTracker(5); // Start tracking for 45 mins
          isTrackingInitialized.current = true; // Mark as initialized
        } 
        
        else if (!isInReels && isTrackingInitialized.current) {
          console.log("Left reels section, resetting tracker status");
          isTrackingInitialized.current = false; // Reset tracker status so it can be restarted later
        }
      } catch (error) {
        console.error("Error in setupReelsTracking:", error);
      }
    };

    // Run the setup immediately
    setupReelsTracking();

    // Observe page changes for SPA navigation
    const observer = new MutationObserver(() => {
      setupReelsTracking();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }, []); // Empty dependency array since we're handling URL changes inside

  return null;
};

export default ContentScript;



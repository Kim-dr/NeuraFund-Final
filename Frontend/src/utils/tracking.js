import socket from './socket';

let trackingWatcherId = null;
let lastSentTimestamp = 0; // Track when we last sent data

// Minimum time between updates (in milliseconds)
// 5000ms = 5 seconds. This prevents server flooding.
const UPDATE_INTERVAL = 5000; 

export const stopTracking = () => {
    if (trackingWatcherId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(trackingWatcherId);
        console.log("🛑 Tracking stopped.");
        trackingWatcherId = null;
    }
};

export const startTracking = (taskId, userId) => {
    // Stop any existing tracker first
    stopTracking();

    if (navigator.geolocation) {
        // Ensure socket is connected
        if (!socket.connected) {
            socket.connect();
        }
        
        // Join the room logic is handled in the React Components now, 
        // but we re-emit here just to be safe for the tracking data flow.
        socket.emit('JOIN_TASK', taskId);

        console.log("🚀 Tracking started for task:", taskId);

        trackingWatcherId = navigator.geolocation.watchPosition(
            (position) => {
                const now = Date.now();
                
                // THROTLE LOGIC: Only send if 5 seconds have passed
                if (now - lastSentTimestamp > UPDATE_INTERVAL) {
                    const { latitude, longitude } = position.coords;
                    
                    // console.log("📍 Sending location update...", latitude, longitude);

                    socket.emit('SEND_LOCATION', {
                        taskId,
                        userId,
                        lat: latitude,
                        lng: longitude
                    });

                    lastSentTimestamp = now;
                }
            },
            (error) => {
                console.error("Geolocation Error:", error);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 0 
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};
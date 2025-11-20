import React, { useEffect, useState, useRef } from 'react';
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import LiveMap from './LiveMap';

// 🛠️ FIX 1: Use Reliable Avatar Service (Stops the network crash)
const getAvatarUrl = (path, name) => {
    if (path && path !== 'undefined' && path !== 'null' && path !== '') {
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/\\/g, '/');
        return `http://localhost:5001${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    }
    const safeName = name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=28a745&color=fff`;
};

const TaskLiveView = ({ taskId, taskCreatorId }) => {
    const { user } = useAuth();
    
    // 🛠️ FIX 2: Robust ID Selection (Fixes "Vendor can't see" bug)
    const currentUserId = user._id || user.id;

    const [messages, setMessages] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null); 
    const [inputMessage, setInputMessage] = useState(''); 
    const notificationSound = useRef(new Audio('/ping.mp3'));

    useEffect(() => {
        if (!socket.connected) socket.connect();
        
        socket.emit('JOIN_TASK', taskId);

        // --- MESSAGE LISTENER ---
        const onMessage = (message) => {
            console.log("FE Vendor Received:", message); // Check console to verify arrival
            
            // Convert IDs to strings to ensure they match
            const senderId = String(message.sender);
            const myId = String(currentUserId);

            // Only add if it's NOT from me
            if (senderId !== myId) {
                setMessages((prev) => [...prev, message]);
                
                // Safe sound play
                const playPromise = notificationSound.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {});
                }
            }
        };

        // --- LOCATION LISTENER ---
        const onLocation = (data) => {
            setCurrentLocation(data);
        };

        socket.on('RECEIVE_MESSAGE', onMessage);
        socket.on('RECEIVE_LOCATION', onLocation);
        
        // Re-join logic
        const onConnect = () => socket.emit('JOIN_TASK', taskId);
        socket.on('connect', onConnect);

        return () => {
            socket.off('RECEIVE_MESSAGE', onMessage);
            socket.off('RECEIVE_LOCATION', onLocation);
            socket.off('connect', onConnect);
        };
    }, [taskId, currentUserId]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputMessage.trim()) {
            const msgData = { 
                taskId, 
                sender: currentUserId, // Send the correct ID
                name: `${user.firstName} (Vendor)`,
                profilePic: user.profilePicUrl, 
                message: inputMessage, 
                timestamp: Date.now()
            };
            // Optimistic Update
            setMessages((prev) => [...prev, msgData]); 
            socket.emit('SEND_MESSAGE', msgData);
            setInputMessage('');
        }
    };

    return (
        <div className="task-live-view-container">
            <button onClick={() => window.location.href='/dashboard/vendor'} className="btn btn-secondary" style={{marginBottom: '15px'}}>
                &larr; Back to Tasks
            </button>
            <h3>Live Task Feed (ID: {taskId})</h3>
            
            <div style={{ marginBottom: '15px', border: '1px solid #ccc', borderRadius: '10px', overflow: 'hidden' }}>
                {currentLocation ? (
                    <>
                        <LiveMap 
                            lat={currentLocation.lat} 
                            lng={currentLocation.lng} 
                            address={currentLocation.address || "Tracking..."} 
                        />
                        <div style={{ padding: '10px', background: '#f9f9f9', borderTop: '1px solid #eee' }}>
                            <p style={{ margin: 0, color: 'green' }}>
                                <strong>Location:</strong> {currentLocation.address || `Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)}`} <br/>
                                <small>Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}</small>
                            </p>
                        </div>
                    </>
                ) : (
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#eee' }}>
                        <p style={{ color: 'orange', fontWeight: 'bold' }}>
                            ⏳ Awaiting student location signal...
                        </p>
                    </div>
                )}
            </div>

            <div className="chat-window" style={{ height: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: '#fff' }}>
                {messages.map((msg, index) => {
                    const isMe = String(msg.sender) === String(currentUserId);
                    const avatarSrc = getAvatarUrl(msg.profilePic, msg.name);
                    
                    return (
                        <div key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px', alignItems: 'flex-end' }}>
                            {!isMe && <img src={avatarSrc} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '8px', border: '1px solid #ccc', objectFit: 'cover' }} />}
                            <div style={{ maxWidth: '70%' }}>
                                <div style={{ fontSize: '0.75em', color: '#666', marginBottom: '2px', textAlign: isMe ? 'right' : 'left' }}>{isMe ? 'You' : msg.name}</div>
                                <div style={{ background: isMe ? '#007bff' : '#f1f0f0', color: isMe ? '#fff' : '#333', padding: '8px 12px', borderRadius: '15px' }}>{msg.message}</div>
                            </div>
                            {isMe && <img src={getAvatarUrl(user.profilePicUrl, user.firstName)} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', marginLeft: '8px', border: '1px solid #ccc', objectFit: 'cover' }} />}
                        </div>
                    );
                })}
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', marginTop: '10px' }}>
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type message..." style={{ flexGrow: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                <button type="submit" className="btn btn-primary" style={{ marginLeft: '10px' }}>Send</button>
            </form>
        </div>
    );
};

export default TaskLiveView;
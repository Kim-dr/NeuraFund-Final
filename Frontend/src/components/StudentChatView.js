import React, { useEffect, useState, useRef } from 'react';
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';

// 🛠️ FIX: Use UI-Avatars (Reliable) instead of Placeholder.com (Blocked)
const getAvatarUrl = (path, name) => {
    // If we have a real uploaded image from backend
    if (path && path !== 'undefined' && path !== 'null' && path !== '') {
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/\\/g, '/');
        return `http://localhost:5001${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    }
    
    // Fallback: Generate Initials Avatar (e.g. "Lucia" -> "L")
    const safeName = name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=007bff&color=fff`;
};

const StudentChatView = ({ taskId, userId, taskDetails }) => {
    const { user } = useAuth();
    const currentUserId = user._id || user.id;
    
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const notificationSound = useRef(new Audio('/ping.mp3'));

    useEffect(() => {
        if (!socket.connected) socket.connect();
        
        socket.emit('JOIN_TASK', taskId);

        const handleReceiveMessage = (message) => {
            console.log("FE Received:", message);
            
            const senderId = String(message.sender);
            const myId = String(currentUserId);

            if (senderId !== myId) {
                setMessages((prev) => [...prev, message]);
                // Safer Audio Play
                const playPromise = notificationSound.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Auto-play was prevented. This is normal in browsers until user interaction.
                        // Silently ignore to prevent console red ink.
                    });
                }
            }
        };

        socket.on('RECEIVE_MESSAGE', handleReceiveMessage);

        const onConnect = () => socket.emit('JOIN_TASK', taskId);
        socket.on('connect', onConnect);

        return () => {
            socket.off('RECEIVE_MESSAGE', handleReceiveMessage);
            socket.off('connect', onConnect);
        };
    }, [taskId, currentUserId]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputMessage.trim()) {
            const msgData = { 
                taskId, 
                sender: currentUserId, 
                name: `${user.firstName} (Student)`,
                profilePic: user.profilePicUrl, 
                message: inputMessage, 
                timestamp: Date.now()
            };

            setMessages((prev) => [...prev, msgData]);
            socket.emit('SEND_MESSAGE', msgData);
            setInputMessage('');
        }
    };

    return (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #007bff', borderRadius: '8px', background: '#fff' }}>
            <h4>Chat with Vendor ({taskDetails.createdBy.firstName})</h4>
            
            <div style={{ height: '250px', overflowY: 'auto', marginBottom: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                {messages.map((msg, index) => {
                    const isMe = String(msg.sender) === String(currentUserId);
                    // Pass Name to the helper for the fallback avatar
                    const avatarSrc = getAvatarUrl(msg.profilePic, msg.name);

                    return (
                        <div key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px', alignItems: 'flex-end' }}>
                            {!isMe && <img src={avatarSrc} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '8px', border: '1px solid #ccc', objectFit: 'cover' }} />}
                            
                            <div style={{ maxWidth: '70%' }}>
                                <div style={{ fontSize: '0.75em', color: '#666', marginBottom: '2px', textAlign: isMe ? 'right' : 'left' }}>
                                    {isMe ? 'You' : msg.name}
                                </div>
                                <div style={{ background: isMe ? '#007bff' : '#e9ecef', color: isMe ? '#fff' : '#333', padding: '8px 12px', borderRadius: '15px' }}>{msg.message}</div>
                            </div>
                            
                            {isMe && <img src={getAvatarUrl(user.profilePicUrl, user.firstName)} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', marginLeft: '8px', border: '1px solid #ccc', objectFit: 'cover' }} />}
                        </div>
                    );
                })}
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex' }}>
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type message..." style={{ flexGrow: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                <button type="submit" className="btn btn-primary" style={{ marginLeft: '10px' }}>Send</button>
            </form>
        </div>
    );
};

export default StudentChatView;
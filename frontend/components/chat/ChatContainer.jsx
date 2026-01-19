import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSocket } from '@/lib/socket';
import { classesApi } from '@/lib/api';
import { ChatSidebar } from './ChatSidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Card } from '@/components/ui/card';
// using console for logging in frontend

export function ChatContainer() {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('BATCH');
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [rooms, setRooms] = useState([]);
    const socketRef = useRef(null);

    // Initialize Socket
    useEffect(() => {
        if (!token) return;

        const socket = getSocket(token);
        socketRef.current = socket;

        socket.connect();

        socket.on('connect', () => {
            console.log('Socket connected');
        });

        socket.on('new-message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on('user-typing', (data) => {
            setTypingUsers((prev) => {
                if (prev.find(u => u.userId === data.userId)) return prev;
                return [...prev, data];
            });
        });

        socket.on('user-stopped-typing', (data) => {
            setTypingUsers((prev) => prev.filter(u => u.userId !== data.userId));
        });

        socket.on('chat-history', (data) => {
            setMessages(data.messages);
        });

        socket.on('joined-room', (data) => {
            console.log('Joined room:', data);
        });

        return () => {
            socket.off('connect');
            socket.off('new-message');
            socket.off('user-typing');
            socket.off('user-stopped-typing');
            socket.off('chat-history');
            socket.off('joined-room');
        };
    }, [token]);

    // Fetch classes for BATCH tab
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                let response;
                if (user.role === 'STUDENT') {
                    response = await classesApi.getMyEnrollments();
                } else {
                    response = await classesApi.getAll();
                }
                if (response.success) {
                    setRooms(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch classes:', error);
            }
        };

        if (activeTab === 'BATCH') {
            fetchClasses();
        } else {
            setRooms([]);
        }
    }, [activeTab, user.role]);

    // Handle Tab Change & Join Room
    useEffect(() => {
        if (!socketRef.current) return;

        // Reset state for new tab
        setMessages([]);
        setTypingUsers([]);
        setActiveRoom(null);

        // Logic to determine which room to join automatically (placeholder logic)
        // In a real app, this would fetch the user's classes or recent chats
        if (activeTab === 'GLOBAL') {
            socketRef.current.emit('get-chat-history', { type: 'GLOBAL' });
        } else if (activeTab === 'FACULTY_LOUNGE') {
            socketRef.current.emit('join-room', { type: 'FACULTY_LOUNGE' });
            socketRef.current.emit('get-chat-history', { type: 'FACULTY_LOUNGE' });
        }
        // More complex logic for BATCH and PRIVATE would go here
    }, [activeTab]);

    const handleRoomSelect = (room) => {
        setActiveRoom(room);
        setMessages([]);
        setTypingUsers([]);

        if (!socketRef.current) return;

        if (activeTab === 'BATCH') {
            // Join class room
            socketRef.current.emit('join-class', room.id);
            // Get chat history for this class
            socketRef.current.emit('get-chat-history', { type: 'BATCH', classId: room.id });
        }
        // Add logic for PRIVATE if needed
    };

    const handleSendMessage = (text) => {
        const payload = {
            message: text,
            type: activeTab,
        };

        if (activeTab === 'BATCH' && activeRoom) {
            payload.classId = activeRoom.id;
        } else if (activeTab === 'PRIVATE' && activeRoom) {
            payload.recipientId = activeRoom.id;
        }

        socketRef.current.emit('send-message', payload);
    };

    const handleTypingStart = () => {
        socketRef.current.emit('typing-start', {
            type: activeTab,
            classId: activeTab === 'BATCH' ? activeRoom?.id : null,
            recipientId: activeTab === 'PRIVATE' ? activeRoom?.id : null
        });
    };

    const handleTypingStop = () => {
        socketRef.current.emit('typing-stop', {
            type: activeTab,
            classId: activeTab === 'BATCH' ? activeRoom?.id : null,
            recipientId: activeTab === 'PRIVATE' ? activeRoom?.id : null
        });
    };

    return (
        <div className="flex h-[calc(100vh-140px)] w-full max-w-7xl mx-auto gap-4 p-4 animate-in fade-in zoom-in-95 duration-500">
            <ChatSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                rooms={rooms}
                userRole={user?.role}
                onRoomSelect={handleRoomSelect}
            />

            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-2xl bg-card/60 backdrop-blur-md rounded-3xl ring-1 ring-white/10">
                <div className="p-6 border-b bg-muted/30 backdrop-blur-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-foreground">
                            {activeTab === 'BATCH' && (activeRoom?.name || 'Select a Class Room')}
                            {activeTab === 'FACULTY_LOUNGE' && 'Faculty Lounge'}
                            {activeTab === 'GLOBAL' && 'School Announcements'}
                            {activeTab === 'PRIVATE' && (activeRoom?.name || 'Select a User')}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            {messages.length} messages in history
                        </p>
                    </div>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                                U{i}
                            </div>
                        ))}
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                            +5
                        </div>
                    </div>
                </div>

                <MessageList
                    messages={messages}
                    currentUser={user}
                    typingUsers={typingUsers}
                />

                <MessageInput
                    onSendMessage={handleSendMessage}
                    onTypingStart={handleTypingStart}
                    onTypingStop={handleTypingStop}
                    placeholder={
                        activeTab === 'BATCH' && !activeRoom ? "Select a class to start chatting..." : "Type your message..."
                    }
                />
            </Card>
        </div>
    );
}

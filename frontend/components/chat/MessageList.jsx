import { useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

export function MessageList({ messages, currentUser, typingUsers = [] }) {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typingUsers]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg, idx) => {
                const isMe = msg.userId === currentUser.id;
                return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                            {!isMe && (
                                <Avatar className="h-8 w-8 shrink-0 mt-1 shadow-sm">
                                    <AvatarImage src={msg.user?.profileImage} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                        {msg.user?.name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && (
                                    <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">
                                        {msg.user?.name} • {msg.user?.role?.toLowerCase()}
                                    </span>
                                )}
                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words whitespace-pre-wrap leading-relaxed ${isMe
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted/80 text-foreground rounded-tl-none'
                                    }`}>
                                    {msg.message}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 px-1`}>
                                    <span className="text-[10px] text-muted-foreground/70">
                                        {format(new Date(msg.createdAt), 'h:mm a')}
                                    </span>
                                    {isMe && <CheckCheck className="h-3 w-3 text-primary" />}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {typingUsers.length > 0 && (
                <div className="flex justify-start items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-1 bg-muted/50 px-4 py-2.5 rounded-2xl rounded-tl-none items-center shadow-sm">
                        <div className="flex gap-1 mr-2">
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-xs italic text-muted-foreground font-medium">
                            {typingUsers.length === 1
                                ? `${typingUsers[0].userName} is typing...`
                                : `${typingUsers.length} people are typing...`}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

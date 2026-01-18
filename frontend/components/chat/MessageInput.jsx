import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MessageInput({ onSendMessage, onTypingStart, onTypingStop, placeholder = "Type a message..." }) {
    const [message, setMessage] = useState('');
    const typingTimeoutRef = useRef(null);

    const handleMessageChange = (e) => {
        const newValue = e.target.value;
        setMessage(newValue);

        if (newValue.length > 0) {
            onTypingStart?.();

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                onTypingStop?.();
            }, 2000);
        } else {
            onTypingStop?.();
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
            onTypingStop?.();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    return (
        <form onSubmit={handleSend} className="p-4 border-t bg-card flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                <Paperclip className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
                <Input
                    value={message}
                    onChange={handleMessageChange}
                    placeholder={placeholder}
                    className="pr-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-11"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                    <Smile className="h-5 w-5" />
                </Button>
            </div>
            <Button
                type="submit"
                size="icon"
                disabled={!message.trim()}
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 active:scale-95 disabled:scale-100 disabled:opacity-50"
            >
                <Send className="h-5 w-5" />
            </Button>
        </form>
    );
}

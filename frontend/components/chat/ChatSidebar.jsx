import { Layout, Users, MessageSquare, Bell, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ChatSidebar({ activeTab, onTabChange, rooms, userRole }) {
    const tabs = [
        { id: 'BATCH', label: 'Batch Groups', icon: Users, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
        { id: 'FACULTY_LOUNGE', label: 'Faculty Lounge', icon: Shield, roles: ['TEACHER', 'ADMIN'] },
        { id: 'GLOBAL', label: 'Global Notices', icon: Bell, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
        { id: 'PRIVATE', label: 'Direct Messages', icon: MessageSquare, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
    ];

    const filteredTabs = tabs.filter(tab => tab.roles.includes(userRole));

    return (
        <div className="w-72 border-r bg-muted/20 flex flex-col">
            <div className="p-6 border-b bg-card/50 backdrop-blur-sm">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Messages</h2>
                <p className="text-xs text-muted-foreground mt-1 font-medium italic">EduTech Communications</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <nav className="space-y-1">
                    {filteredTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                                    : "hover:bg-muted/80 text-muted-foreground hover:text-foreground hover:scale-[1.01]"
                            )}
                        >
                            <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-primary-foreground" : "group-hover:text-primary")} />
                            <span className="text-sm font-semibold tracking-wide">{tab.label}</span>
                            {activeTab === tab.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full opacity-50" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="space-y-3">
                    <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                        Recent {activeTab.toLowerCase()}
                    </h3>
                    <div className="space-y-1">
                        {rooms.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-muted-foreground italic bg-muted/30 rounded-lg mx-2 border border-dashed border-muted-foreground/20">
                                No active {activeTab.toLowerCase()} rooms
                            </p>
                        ) : (
                            rooms.map((room) => (
                                <button
                                    key={room.id}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/50 transition-all group scale-100 active:scale-[0.98]"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                                        {room.name?.substring(0, 1).toUpperCase() || <Layout className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{room.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate font-medium">{room.lastMessage || 'No messages yet'}</p>
                                    </div>
                                    {room.unread > 0 && (
                                        <Badge className="bg-primary text-primary-foreground border-none h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full shadow-lg shadow-primary/30">
                                            {room.unread}
                                        </Badge>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t bg-card/30 backdrop-blur-sm">
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-2xl border border-muted-foreground/10">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <User className="h-4 w-4 text-primary" />
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-xs font-bold truncate">Online Help</p>
                        <p className="text-[10px] text-primary font-semibold animate-pulse">Live Support</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Avatar({ children, className }) {
    return (
        <div className={cn("rounded-full bg-muted flex items-center justify-center overflow-hidden", className)}>
            {children}
        </div>
    );
}

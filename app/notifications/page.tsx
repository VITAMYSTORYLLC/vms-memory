"use client";

import React from "react";
import { FiBell, FiInfo, FiStar, FiCheckCircle } from "react-icons/fi"; // Removed FiCheck as it was unused
import { useMemory } from "../context/MemoryContext";
import { NotificationType } from "../types";

export default function NotificationsPage() {
    const { notifications, markAsRead, markAllAsRead, deleteNotification, isHydrated } = useMemory();

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case "info": return <FiInfo className="text-blue-500" />;
            case "success": return <FiCheckCircle className="text-green-500" />;
            case "feature": return <FiStar className="text-purple-500" />;
            default: return <FiBell className="text-stone-400" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNotification(id);
    };

    if (!isHydrated) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] safe-top safe-bottom pb-24">
            <div className="w-full max-w-lg font-sans h-full sm:h-auto min-h-screen sm:min-h-0 bg-[#F9F8F6] sm:bg-transparent">
                <div className="p-6 pt-12">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-serif font-bold text-stone-900">Notifications</h1>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                                    <FiBell size={24} />
                                </div>
                                <p className="text-stone-400 text-sm">No notifications yet.</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => markAsRead(n.id)}
                                    className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${n.read
                                            ? "bg-white border-stone-100 opacity-70 hover:opacity-100"
                                            : "bg-white border-stone-200 shadow-sm"
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`mt-1 flex-shrink-0 ${!n.read ? "scale-110" : "grayscale"}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`text-sm font-bold mb-1 ${n.read ? "text-stone-600" : "text-stone-900"}`}>
                                                    {n.title}
                                                </h3>
                                                {!n.read && (
                                                    <span className="w-2 h-2 rounded-full bg-red-400 block mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-stone-500 leading-relaxed pr-6">{n.message}</p>
                                            <p className="text-[10px] text-stone-300 mt-2">
                                                {new Date(n.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => handleDelete(n.id, e)}
                                            className="absolute top-2 right-2 p-2 text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

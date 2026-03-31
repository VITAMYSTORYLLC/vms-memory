"use client";

import React from "react";
import { FiBell, FiInfo, FiStar, FiCheckCircle, FiTrash2, FiHeart, FiMessageSquare, FiEye, FiEdit3, FiInbox } from "react-icons/fi";
import { useMemory } from "@/context/MemoryContext";
import { useAuth } from "@/hooks/useAuth";
import { useActivityFeed } from "@/hooks/useEngagement";
import { NotificationType, Person, MemoryItem } from "@/types";

export default function NotificationsPage() {
    const { notifications, markAsRead, markAllAsRead, deleteNotification, isHydrated, t, pendingMemories, activePerson, setPeople, lang } = useMemory();
    const { user } = useAuth();
    const { activities, unreadCount: activityUnreadCount, handleMarkAsRead, handleMarkAllAsRead } = useActivityFeed(user?.uid || null);

    const handleApprove = (memoryId: string) => {
        if (!activePerson) return;
        setPeople((prev: Person[]) => prev.map((p: Person) => {
            if (p.id !== activePerson.id) return p;
            return { ...p, memories: p.memories.map((m: MemoryItem) => m.id === memoryId ? { ...m, status: "published" } as MemoryItem : m) };
        }));
    };

    const handleDismiss = (memoryId: string) => {
        if (!activePerson) return;
        setPeople((prev: Person[]) => prev.map((p: Person) => {
            if (p.id !== activePerson.id) return p;
            return { ...p, memories: p.memories.filter((m: MemoryItem) => m.id !== memoryId) };
        }));
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case "info": return <FiInfo className="text-blue-500" />;
            case "success": return <FiCheckCircle className="text-green-500" />;
            case "feature": return <FiStar className="text-purple-500" />;
            default: return <FiBell className="text-stone-400" />;
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "like": return <FiHeart className="text-red-400 fill-current" size={16} />;
            case "comment": return <FiMessageSquare className="text-blue-400" size={16} />;
            case "view": return <FiEye className="text-stone-400" size={16} />;
            case "answer": return <FiEdit3 className="text-[#8B7355]" size={16} />;
            default: return <FiBell className="text-stone-400" size={16} />;
        }
    };

    const getActivityText = (activity: any) => {
        switch (activity.type) {
            case "like":
                return `${activity.actorName} liked your memory about ${activity.personName}`;
            case "comment":
                return `${activity.actorName} commented on your memory about ${activity.personName}${activity.commentText ? `: "${activity.commentText}"` : ""}`;
            case "view":
                return `${activity.actorName} viewed your story about ${activity.personName}`;
            case "answer":
                return `${activity.actorName} answered a question about ${activity.personName}`;
            default:
                return `New activity on ${activity.personName}'s story`;
        }
    };

    const localUnreadCount = notifications.filter(n => !n.read).length;
    const totalUnread = localUnreadCount + activityUnreadCount;

    // Sort activities newest first
    const sortedActivities = [...activities].sort((a, b) => b.createdAt - a.createdAt);

    if (!isHydrated) return null;

    return (
        <div className="min-h-screen bg-[#F9F8F6] dark:bg-stone-950 safe-top safe-bottom pb-24 transition-colors duration-500">
            <div className="w-full max-w-lg mx-auto font-sans h-full sm:h-auto min-h-screen sm:min-h-0">
                <div className="p-6 pt-20">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{t.notificationsTitle}</h1>
                        {totalUnread > 0 && (
                            <button
                                onClick={() => { markAllAsRead(); handleMarkAllAsRead(); }}
                                className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
                            >
                                {t.markAllRead}
                            </button>
                        )}
                    </div>

                    {/* === PENDING CONTRIBUTIONS === */}
                    {pendingMemories.length > 0 && (
                        <div className="mb-6">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 mb-3 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                {lang === "es" ? "Contribuciones de familia" : "Family Contributions"}
                            </p>
                            <div className="space-y-3">
                                {pendingMemories.map((memory: MemoryItem) => (
                                    <div key={memory.id} className="bg-white dark:bg-stone-900 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4 shadow-sm">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 flex-shrink-0 mt-0.5">
                                                <FiInbox size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-0.5">
                                                    {memory.authorName || (lang === "es" ? "Familiar" : "Family member")}
                                                </p>
                                                <p className="text-sm text-stone-800 dark:text-stone-200 font-serif leading-snug">
                                                    {memory.text}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(memory.id)}
                                                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors"
                                            >
                                                {lang === "es" ? "✓ Aprobar" : "✓ Approve"}
                                            </button>
                                            <button
                                                onClick={() => handleDismiss(memory.id)}
                                                className="px-4 py-2 text-stone-400 text-xs font-bold rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                            >
                                                {lang === "es" ? "Ignorar" : "Dismiss"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activity Feed (Firebase: likes, comments, answers) */}
                    {sortedActivities.length > 0 && (
                        <div className="mb-6">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 mb-3">Family Activity</p>
                            <div className="space-y-3">
                                {sortedActivities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        onClick={() => handleMarkAsRead(activity.id)}
                                        className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${activity.read
                                            ? "bg-white/50 dark:bg-stone-900/50 border-stone-100 dark:border-stone-800 opacity-60 hover:opacity-100"
                                            : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm"
                                            }`}
                                    >
                                        <div className="flex gap-3 items-start">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0 mt-0.5">
                                                {activity.actorPhoto ? (
                                                    <img src={activity.actorPhoto} alt={activity.actorName} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[#8B7355] flex items-center justify-center text-white text-xs font-semibold">
                                                        {activity.actorName?.charAt(0)?.toUpperCase() || "?"}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    {getActivityIcon(activity.type)}
                                                    {!activity.read && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 block animate-pulse ml-auto" />
                                                    )}
                                                </div>
                                                <p className={`text-sm leading-snug ${activity.read ? "text-stone-500 dark:text-stone-500" : "text-stone-800 dark:text-stone-200"}`}>
                                                    {getActivityText(activity)}
                                                </p>
                                                <p className="text-[10px] text-stone-400 dark:text-stone-600 mt-1.5 font-medium tracking-wide">
                                                    {new Date(activity.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Local Notifications (milestone badges, system messages) */}
                    <div className="space-y-3">
                        {notifications.length === 0 && sortedActivities.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300 dark:text-stone-700">
                                    <FiBell size={24} />
                                </div>
                                <p className="text-stone-400 dark:text-stone-600 text-sm font-serif italic text-lg">{t.noNotifications}</p>
                            </div>
                        ) : (
                            <>
                                {notifications.length > 0 && sortedActivities.length > 0 && (
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 mb-3">System</p>
                                )}
                                {notifications.map((n) => {
                                    let title = n.title;
                                    let message = n.message;

                                    if (n.translationData) {
                                        const { titleKey, bodyKey, params } = n.translationData;
                                        const anyT = t as any;
                                        if (titleKey && anyT[titleKey]) {
                                            const val = anyT[titleKey];
                                            title = typeof val === "function" ? val(params?.name || "") : val;
                                        }
                                        if (bodyKey && anyT[bodyKey]) {
                                            const val = anyT[bodyKey];
                                            message = typeof val === "function" ? val(params?.name || "") : val;
                                        }
                                    }

                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id)}
                                            className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${n.read
                                                ? "bg-white/50 dark:bg-stone-900/50 border-stone-100 dark:border-stone-800 opacity-60 hover:opacity-100"
                                                : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm"
                                                }`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`mt-1 flex-shrink-0 ${!n.read ? "scale-110" : "grayscale opacity-50"}`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className={`text-lg font-sans font-semibold mb-1 ${n.read ? "text-stone-500 dark:text-stone-500" : "text-stone-900 dark:text-stone-100"}`}>
                                                            {title}
                                                        </h3>
                                                        {!n.read && (
                                                            <span className="w-2 h-2 rounded-full bg-red-500 block mt-1.5 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed pr-6">{message}</p>
                                                    <p className="text-xs text-stone-400 dark:text-stone-600 mt-2 font-medium tracking-wide font-sans">
                                                        {new Date(n.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                    className="absolute top-2 right-2 p-2 text-stone-300 dark:text-stone-700 hover:text-red-400 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

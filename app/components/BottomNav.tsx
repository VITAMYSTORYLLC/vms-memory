"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiBook, FiUsers, FiUser, FiBell, FiPlus, FiBox } from 'react-icons/fi';
import { useMemory } from '../context/MemoryContext';
import { Haptics } from '../utils/haptics';
import { motion } from 'framer-motion';
import { AddMenu } from './AddMenu';

export default function BottomNav() {
    const pathname = usePathname();
    const { notifications, t, pendingMemories, activePerson } = useMemory();
    const unreadCount = notifications.filter(n => !n.read).length;
    const pendingCount = pendingMemories.length;
    const [isAddMenuOpen, setIsAddMenuOpen] = React.useState(false);

    // Show active person's photo in the Stories tab when available
    const storiesIcon = activePerson?.photoUrl ? (
        <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-amber-400/80 dark:ring-amber-500/60">
            <img src={activePerson.photoUrl} alt={activePerson.name} className="w-full h-full object-cover" />
        </div>
    ) : (
        <FiBook size={24} />
    );

    // Navigation items with the central "Add" placeholder
    const navItems = [
        { href: '/profile', label: t.navProfile, icon: <FiUser size={24} /> },
        { href: '/stories', label: t.navStories, icon: storiesIcon },
        { href: '#add', label: '', icon: <FiPlus size={32} />, isAdd: true }, // Central Add Button
        { href: '/family', label: t.navFamily, icon: <FiUsers size={24} /> },
        { href: '/notifications', label: t.navNotifications, icon: <FiBell size={24} /> },
    ];

    const totalBadgeCount = unreadCount + pendingCount;

    return (
        <>
            <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-900 shadow-t flex justify-around items-end z-30 pb-safe pt-2 h-[calc(4rem+env(safe-area-inset-bottom))]">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    const isNotifications = item.href === '/notifications';
                    const isInbox = item.href === '/inbox';

                    if (item.isAdd) {
                        return (
                            <div key="add-button" className="relative -top-5">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsAddMenuOpen(true)}
                                    className="w-14 h-14 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center text-white dark:text-stone-900 shadow-lg shadow-stone-900/20 dark:shadow-stone-100/20 hover:scale-105 transition-transform"
                                >
                                    <FiPlus size={28} />
                                </motion.button>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => Haptics.light()}
                            className="relative pb-2 w-16"
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className={`flex flex-col items-center transition-colors ${isActive ? 'text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400'}`}
                            >
                                <div className="relative">
                                    {item.icon}
                                    {isNotifications && totalBadgeCount > 0 && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in duration-300 shadow-md border border-white dark:border-stone-950">
                                            {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                                        </div>
                                    )}
                                    {isInbox && pendingCount > 0 && (
                                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in duration-300 shadow-md border border-white dark:border-stone-950">
                                            {pendingCount > 9 ? '9+' : pendingCount}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] mt-1 uppercase tracking-widest font-bold">{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            <AddMenu isOpen={isAddMenuOpen} onClose={() => setIsAddMenuOpen(false)} />
        </>
    );
}

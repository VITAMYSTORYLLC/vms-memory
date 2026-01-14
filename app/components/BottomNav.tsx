"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiBook, FiUsers, FiUser, FiBell } from 'react-icons/fi';
import { useMemory } from '../context/MemoryContext';
import { Haptics } from '../utils/haptics';
import { motion } from 'framer-motion';

export default function BottomNav() {
    const pathname = usePathname();
    const { notifications, t } = useMemory();
    const unreadCount = notifications.filter(n => !n.read).length;

    const navItems = [
        { href: '/family', label: t.navFamily, icon: <FiUsers size={24} /> },
        { href: '/stories', label: t.navStories, icon: <FiBook size={24} /> },
        { href: '/notifications', label: t.navNotifications, icon: <FiBell size={24} /> },
        { href: '/profile', label: t.navProfile, icon: <FiUser size={24} /> },
    ];

    return (
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-900 shadow-t flex justify-around items-center z-50 pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isNotifications = item.href === '/notifications';

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => Haptics.light()}
                        className="relative"
                    >
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={`flex flex-col items-center transition-colors ${isActive ? 'text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400'}`}
                        >
                            <div className="relative">
                                {item.icon}
                                {isNotifications && unreadCount > 0 && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in duration-300 shadow-md border border-white dark:border-stone-950">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] mt-1 uppercase tracking-widest font-bold">{item.label}</span>
                        </motion.div>
                    </Link>
                );
            })}
        </nav>
    );
}

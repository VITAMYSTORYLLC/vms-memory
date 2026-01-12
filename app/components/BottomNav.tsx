"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiBook, FiUsers, FiUser, FiBell } from 'react-icons/fi';
import { useMemory } from '../context/MemoryContext';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

export default function BottomNav() {
    const pathname = usePathname();
    const { notifications, t } = useMemory();
    const unreadCount = notifications.filter(n => !n.read).length;

    const navItems = [
        { href: '/profile', label: t.navProfile, icon: <FiUser size={24} /> },
        { href: '/stories', label: t.navStories, icon: <FiBook size={24} /> },
        { href: '/family', label: t.navFamily, icon: <FiUsers size={24} /> },
        { href: '/notifications', label: t.navNotifications, icon: <FiBell size={24} /> },
    ];

    return (
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-t flex justify-around items-center z-50 pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isNotifications = item.href === '/notifications';

                return (
                    <Link key={item.href} href={item.href} className={`flex flex-col items-center transition-colors relative ${isActive ? 'text-stone-900 dark:text-white font-medium' : 'text-stone-400 dark:text-gray-500 hover:text-stone-600'}`}>
                        <div className="relative">
                            {item.icon}
                            {isNotifications && unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] mt-1 uppercase tracking-widest font-bold">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

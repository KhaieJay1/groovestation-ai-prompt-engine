"use client";
import React from 'react';
import { Home, Music, FileText, Palette, Lightbulb, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="card-panel flex flex-col h-full" style={{ background: 'var(--card-bg)', borderRight: '2px solid var(--border-color)' }}>
            {/* Brand Header */}
            <div className="p-6" style={{ borderBottom: '2px solid var(--border-color)' }}>
                <h1 className="text-xl font-black tracking-wide">
                    <span className="text-white">Buss</span>
                    <span style={{ color: 'var(--primary-color)' }}>Groove</span>
                </h1>
                <p style={{ color: 'var(--secondary-text)', fontSize: '12px', marginTop: '4px' }}>Station</p>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 p-4 space-y-3">
                <NavCard href="/" icon={<Home size={20} />} label="Dashboard" pathname={pathname} />

                <div className="pt-4 pb-2">
                    <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: 'var(--secondary-text)'
                    }}>
                        Workspaces
                    </span>
                </div>

                <NavCard href="/inspirations" icon={<Lightbulb size={20} />} label="Inspirations" pathname={pathname} />
                <NavCard href="/songs" icon={<Music size={20} />} label="Track Library" pathname={pathname} />
                <NavCard href="/prompts" icon={<FileText size={20} />} label="Prompt Generator" pathname={pathname} />
                <NavCard href="/styles" icon={<Palette size={20} />} label="Catalogs" pathname={pathname} />
            </nav>

            {/* Footer */}
            <div className="p-4" style={{ borderTop: '2px solid var(--border-color)' }}>
                <NavCard href="/settings" icon={<Settings size={20} />} label="Settings" pathname={pathname} />
            </div>
        </div>
    );
}

function NavCard({ href, icon, label, pathname }: { href: string; icon: React.ReactNode; label: string; pathname: string }) {
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: isActive ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                background: isActive ? 'rgba(0, 255, 136, 0.1)' : 'var(--bg-color)',
                color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
            }}
            className="hover:border-[var(--primary-color)] hover:bg-[rgba(0,255,136,0.05)]"
        >
            <span style={{ color: isActive ? 'var(--primary-color)' : 'var(--secondary-text)' }}>{icon}</span>
            <span>{label}</span>
        </Link>
    );
}

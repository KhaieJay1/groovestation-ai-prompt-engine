import { Sidebar } from '@/components/Sidebar';
import './globals.css';
import DownloadManager from "@/components/DownloadManager";

export const metadata = {
  title: 'BussGroove Station',
  description: 'AI Music Production Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DownloadManager />
        <div className="app-layout">
          <Sidebar />
          <main className="bg-[var(--bg-darkest)]" style={{ overflow: 'visible' }}>
            <div style={{ height: '100vh', overflowY: 'auto' }}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

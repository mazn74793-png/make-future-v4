import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'منصتي التعليمية',
  description: 'منصة الطالب الذكية',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.toggle('dark', savedTheme === 'dark');
                  document.documentElement.classList.toggle('light', savedTheme === 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-indigo-500/30">
        <div className="site-bg" aria-hidden="true">
          <div className="aurora-orb aurora-orb-1 bg-indigo-500/30" />
          <div className="aurora-orb aurora-orb-2 bg-purple-500/30" />
        </div>

        <main className="relative z-10">
          {children}
        </main>

        <Toaster position="top-center" />
      </body>
    </html>
  );
}

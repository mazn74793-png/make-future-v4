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
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="site-bg" aria-hidden="true">
          <div className="aurora-orb bg-indigo-500/20 top-[-10%] left-[-10%]" />
          <div className="aurora-orb bg-purple-500/20 bottom-[-10%] right-[-10%]" />
        </div>
        <main className="relative z-10">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

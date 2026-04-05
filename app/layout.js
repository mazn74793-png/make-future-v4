import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'منصتي التعليمية | لوحة التحكم',
  description: 'أفضل منصة للتعلم الحر والتفاعلي',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* السكريبت ده وظيفته يخلي الثيم يشتغل فوراً قبل تحميل الصفحة */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
       head>
      <body className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30">
        
        {/* طبقات الخلفية الثابتة (Aurora) - هتظهر في كل صفحات الموقع */}
        <div className="site-bg" aria-hidden="true">
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
          <div className="aurora-orb aurora-orb-4" />
          
          <div className="particle p1" />
          <div className="particle p2" />
          <div className="particle p3" />
          <div className="particle p4" />
          <div className="particle p5" />
        </div>

        {/* المحتوى الرئيسي */}
        <main className="relative z-10">
          {children}
        </main>

        {/* نظام التنبيهات */}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#121214',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
      </body>
    </html>
  );
}

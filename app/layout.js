// app/layout.js
import './globals.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen relative overflow-x-hidden">
        {/* Background Layers */}
        <div className="site-bg">
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
          <div className="aurora-orb aurora-orb-4" />
          
          {/* Particles */}
          <div className="particle p1" />
          <div className="particle p2" />
          <div className="particle p3" />
          <div className="particle p4" />
          <div className="particle p5" />
        </div>

        {/* Main Content */}
        <main className="relative z-10">
          {children}
        </main>

        <Toaster position="top-center" />
      </body>
    </html>
  );
}

import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'منصة تعليمية',
  description: 'منصة تعليمية احترافية',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(108, 92, 231, 0.3)',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}

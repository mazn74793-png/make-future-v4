import './globals.css';
import ToasterProvider from '@/components/ToasterProvider';

export const metadata = {
  title: 'منصة تعليمية',
  description: 'منصة تعليمية احترافية',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}

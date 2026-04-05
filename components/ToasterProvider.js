// layout.js
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

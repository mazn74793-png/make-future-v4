'use client';
import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
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
  );
}

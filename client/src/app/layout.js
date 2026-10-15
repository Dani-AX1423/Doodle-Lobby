import './globals.css';
import { SocketProvider } from '../hooks/useSocket';

export const metadata = {
  title: 'DoodleLobby - Real-Time Collaborative Whiteboard',
  description: 'High-performance real-time collaborative canvas and digital whiteboard.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}

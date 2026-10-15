import './globals.css';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { SocketProvider } from '../hooks/useSocket';
import { ThemeProvider } from '../context/ThemeContext';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'DoodleLobby - Real-Time Collaborative Whiteboard',
  description: 'High-performance real-time collaborative canvas and digital whiteboard.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${sansFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen antialiased font-sans selection:bg-indigo-500/20 selection:text-indigo-400">
        <ThemeProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import Script from 'next/script';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'PainMap',
    description: 'See your pain more clearly.',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                    <link
                        rel="preconnect"
                        href={process.env.NEXT_PUBLIC_SUPABASE_URL}
                        crossOrigin=""
                    />
                ) : null}
            </head>
            <body className={`${inter.className} antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}

'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';

export default function NotFound() {
    return (
        <PageLayout>
            <div className="pt-8 animate-fade-in text-center">
                <h1 className="text-heading mb-4">Page not found</h1>
                <p className="text-muted-foreground mb-8">
                    The page you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link
                    href="/"
                    className="text-foreground underline hover:no-underline"
                >
                    Go back home
                </Link>
            </div>
        </PageLayout>
    );
}

'use client';

import { User } from 'lucide-react';

interface AccountInfoProps {
    email: string | null;
    entryCount: number;
}

export function AccountInfo({ email, entryCount }: AccountInfoProps) {
    return (
        <div className="p-4 bg-card rounded-sm">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                        {email || 'Not signed in'}
                    </p>
                    <p className="text-label">
                        {entryCount} entries synced
                    </p>
                </div>
            </div>
        </div>
    );
}

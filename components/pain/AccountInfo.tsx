'use client';

interface AccountInfoProps {
    email: string | null;
    entryCount: number;
}

export function AccountInfo({ email, entryCount }: AccountInfoProps) {
    const avatarLabel = (email || '?').charAt(0).toUpperCase();

    return (
        <div className="flex items-center gap-[14px] rounded-[18px] bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dcf5f7] text-[17px] font-semibold text-[#005b65]">
                {avatarLabel}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#1c211d]">
                    {email || 'Not signed in'}
                </p>
                <span className="flex items-center gap-[5px] text-[12px] text-[#008858]">
                    <svg
                        width="11"
                        height="11"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M4 10.5l4 4 8-9" />
                    </svg>
                    {entryCount} entries synced
                </span>
            </div>
        </div>
    );
}

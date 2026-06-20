'use client';

import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecoveryCodeCardProps {
  code: string; // formatted XXXX-XXXX-XXXX
}

export function RecoveryCodeCard({ code }: RecoveryCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = `Your PainMap recovery code:\n\n${code}\n\nKeep this safe — it is the only way to restore your data on another device. There is no email reset.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'painmap-recovery-code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-[18px] border border-[#eef1ee] bg-[#fafbfa] p-6 text-center">
      <p
        className="select-all font-mono text-[28px] font-bold tracking-[0.12em] text-[#1c211d]"
        aria-label={`Recovery code: ${code}`}
      >
        {code}
      </p>
      <div className="mt-5 flex gap-3">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="h-[44px] flex-1 rounded-full border-[#dde2dd] text-[13.5px]"
          aria-live="polite"
        >
          {copied ? (
            <><Check className="mr-2 h-4 w-4 text-[#008858]" />Copied</>
          ) : (
            <><Copy className="mr-2 h-4 w-4" />Copy</>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="h-[44px] flex-1 rounded-full border-[#dde2dd] text-[13.5px]"
        >
          <Download className="mr-2 h-4 w-4" />
          Save .txt
        </Button>
      </div>
    </div>
  );
}

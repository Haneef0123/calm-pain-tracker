'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

const BACKUP_STATUS_KEY = ['backup-status'] as const;

async function fetchBackupStatus(): Promise<boolean> {
  const res = await fetch('/api/recovery/status');
  if (!res.ok) return false;
  const data = await res.json();
  return data.backedUp as boolean;
}

export function useBackupStatus() {
  const queryClient = useQueryClient();

  const { data: isBackedUp = false, isLoading } = useQuery({
    queryKey: BACKUP_STATUS_KEY,
    queryFn: fetchBackupStatus,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const markBackedUp = () => {
    queryClient.setQueryData(BACKUP_STATUS_KEY, true);
  };

  return { isBackedUp, isLoading, markBackedUp };
}

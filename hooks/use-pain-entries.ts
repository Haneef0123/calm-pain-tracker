'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PainEntry, DbPainEntry, NewPainEntry, dbToClient, clientToDb } from '@/types/pain-entry';
import { toast } from '@/hooks/use-toast';
import { revalidatePainEntries } from '@/lib/actions/revalidate';
import { trackClientEvent } from '@/lib/analytics/client';

// Query key for React Query cache
const PAIN_ENTRIES_KEY = ['pain-entries'] as const;

// Fetch function for React Query
async function fetchPainEntries(): Promise<PainEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pain_entries')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to fetch entries:', error);
    throw error;
  }

  return (data as DbPainEntry[]).map(dbToClient);
}

// Get current user ID from authenticated user (more secure than session)
async function getCurrentUserId(): Promise<string> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) throw new Error('Not authenticated');
  return user.id;
}

export function usePainEntries(initialEntries: PainEntry[] = []) {
  const queryClient = useQueryClient();
  const hasInitialData = initialEntries.length > 0;

  // Main query with SSR hydration support
  const { data: entries = [], isLoading, isFetching, error } = useQuery({
    queryKey: PAIN_ENTRIES_KEY,
    queryFn: fetchPainEntries,
    // Hydrate with SSR data if available
    initialData: hasInitialData ? initialEntries : undefined,
    initialDataUpdatedAt: hasInitialData ? Date.now() : undefined,

    // Data is fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep unused data in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Prevent ALL refetches when we have SSR data
    refetchOnMount: hasInitialData ? false : true,
    refetchOnWindowFocus: false, // Never refetch on window focus - mutations handle updates
    refetchOnReconnect: false,
  });

  // Show error toast if query fails
  if (error) {
    toast({
      title: 'Failed to load entries',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive',
    });
  }

  // Add entry mutation with optimistic update
  const addMutation = useMutation({
    mutationFn: async (entry: NewPainEntry): Promise<PainEntry> => {
      const userId = await getCurrentUserId();
      const supabase = createClient();

      const { data, error } = await supabase
        .from('pain_entries')
        .insert({
          ...clientToDb(entry),
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return dbToClient(data as DbPainEntry);
    },
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PAIN_ENTRIES_KEY });

      // Snapshot previous value
      const previous = queryClient.getQueryData<PainEntry[]>(PAIN_ENTRIES_KEY);

      // Optimistically update cache
      const tempId = crypto.randomUUID();
      const tempEntry: PainEntry = {
        ...newEntry,
        id: tempId,
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData<PainEntry[]>(PAIN_ENTRIES_KEY, (old = []) => [tempEntry, ...old]);

      return { previous, tempId };
    },
    onError: (error, _newEntry, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(PAIN_ENTRIES_KEY, context.previous);
      }
      toast({
        title: 'Failed to save entry',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
    onSuccess: async (newEntry, variables, context) => {
      // Replace temp entry with real one
      queryClient.setQueryData<PainEntry[]>(PAIN_ENTRIES_KEY, (old = []) =>
        old.map(e => e.id === context?.tempId ? newEntry : e)
      );
      // Invalidate server cache
      await revalidatePainEntries();

      if ((context?.previous?.length ?? 0) === 0) {
        void trackClientEvent('first_entry_logged', {
          painLevel: variables.painLevel,
        });
      }
    },
  });

  // Update entry mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NewPainEntry> }): Promise<void> => {
      const supabase = createClient();

      const dbUpdates: Partial<DbPainEntry> = {};
      if (updates.painLevel !== undefined) dbUpdates.pain_level = updates.painLevel;
      if (updates.locations !== undefined) dbUpdates.locations = updates.locations;
      if (updates.types !== undefined) dbUpdates.types = updates.types;
      if (updates.radiating !== undefined) dbUpdates.radiating = updates.radiating;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('pain_entries')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: PAIN_ENTRIES_KEY });
      const previous = queryClient.getQueryData<PainEntry[]>(PAIN_ENTRIES_KEY);

      queryClient.setQueryData<PainEntry[]>(PAIN_ENTRIES_KEY, (old = []) =>
        old.map(entry => entry.id === id ? { ...entry, ...updates } : entry)
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PAIN_ENTRIES_KEY, context.previous);
      }
      toast({
        title: 'Failed to update entry',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
    onSuccess: async () => {
      await revalidatePainEntries();
    },
  });

  // Delete entry mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from('pain_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PAIN_ENTRIES_KEY });
      const previous = queryClient.getQueryData<PainEntry[]>(PAIN_ENTRIES_KEY);

      queryClient.setQueryData<PainEntry[]>(PAIN_ENTRIES_KEY, (old = []) =>
        old.filter(entry => entry.id !== id)
      );

      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PAIN_ENTRIES_KEY, context.previous);
      }
      toast({
        title: 'Failed to delete entry',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
    onSuccess: async () => {
      await revalidatePainEntries();
    },
  });

  // Clear all entries mutation
  const clearAllMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const userId = await getCurrentUserId();
      const supabase = createClient();

      const { error } = await supabase
        .from('pain_entries')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: PAIN_ENTRIES_KEY });
      const previous = queryClient.getQueryData<PainEntry[]>(PAIN_ENTRIES_KEY);

      queryClient.setQueryData<PainEntry[]>(PAIN_ENTRIES_KEY, []);

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PAIN_ENTRIES_KEY, context.previous);
      }
      toast({
        title: 'Failed to clear entries',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
    onSuccess: async () => {
      await revalidatePainEntries();
    },
  });

  // Export to CSV (uses current entries from cache)
  const exportToCsv = useCallback(() => {
    const headers = ['Date', 'Time', 'Pain Level', 'Locations', 'Types', 'Radiating', 'Notes'];
    const rows = entries.map(entry => {
      const date = new Date(entry.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        entry.painLevel,
        entry.locations.join('; '),
        entry.types.join('; '),
        entry.radiating ? 'Yes' : 'No',
        `"${entry.notes.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pain-diary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  // isLoaded is true if:
  // 1. We have SSR data (initialEntries) - always ready to render
  // 2. OR we're not in initial loading state (!isLoading)
  // This prevents the loading flicker when navigating between pages
  const isLoaded = hasInitialData || !isLoading;

  return {
    entries,
    isLoaded,
    isFetching, // Expose for debugging/UI if needed
    addEntry: (entry: NewPainEntry) => addMutation.mutateAsync(entry),
    updateEntry: (id: string, updates: Partial<NewPainEntry>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteEntry: (id: string) => deleteMutation.mutateAsync(id),
    clearAllEntries: () => clearAllMutation.mutateAsync(),
    exportToCsv,
  };
}

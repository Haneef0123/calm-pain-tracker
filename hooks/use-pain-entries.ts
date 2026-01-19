'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PainEntry, DbPainEntry, NewPainEntry, dbToClient, clientToDb } from '@/types/pain-entry';
import { toast } from '@/hooks/use-toast';
import type { SupabaseClient } from '@supabase/supabase-js';

export function usePainEntries(initialEntries: PainEntry[] = []) {
  const [entries, setEntries] = useState<PainEntry[]>(initialEntries);
  const [isLoaded, setIsLoaded] = useState(initialEntries.length > 0);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const initializedRef = useRef(initialEntries.length > 0);

  // Get or create client (only on client side)
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  // Get current user - middleware guarantees auth on protected routes
  const getUser = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user;
  }, [getSupabase]);

  // Only fetch if no initial entries were provided (client-side navigation)
  useEffect(() => {
    // Skip fetch if we have initial entries from SSR
    if (initializedRef.current) {
      setIsLoaded(true);
      return;
    }

    const fetchEntries = async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('pain_entries')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Failed to fetch entries:', error);
          toast({
            title: 'Failed to load entries',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setEntries((data as DbPainEntry[]).map(dbToClient));
        }
      } catch (error) {
        console.error('Connection error while fetching entries:', error);
        toast({
          title: 'Connection error',
          description: 'Unable to reach server. Please check your connection.',
          variant: 'destructive',
        });
      } finally {
        setIsLoaded(true);
      }
    };

    fetchEntries();
  }, [getSupabase]);

  const addEntry = useCallback(async (entry: NewPainEntry): Promise<PainEntry> => {
    try {
      const user = await getUser();
      const supabase = getSupabase();

      // Optimistic update
      const tempId = crypto.randomUUID();
      const tempEntry: PainEntry = {
        ...entry,
        id: tempId,
        timestamp: new Date().toISOString(),
      };
      setEntries(prev => [tempEntry, ...prev]);

      const { data, error } = await supabase
        .from('pain_entries')
        .insert({
          ...clientToDb(entry),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        // Rollback
        setEntries(prev => prev.filter(e => e.id !== tempId));
        toast({
          title: 'Failed to save entry',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      const newEntry = dbToClient(data as DbPainEntry);
      // Replace temp entry with real one
      setEntries(prev => prev.map(e => e.id === tempId ? newEntry : e));
      return newEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Connection error',
        description: 'Unable to reach server. Please check your connection and try again.',
        variant: 'destructive',
      });

      console.error('Add entry error:', errorMessage);
      throw error;
    }
  }, [getUser, getSupabase]);

  const updateEntry = useCallback(async (id: string, updates: Partial<NewPainEntry>): Promise<void> => {
    try {
      const supabase = getSupabase();

      // Store previous state for rollback
      const previousEntries = entries;

      // Optimistic update
      setEntries(prev => prev.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      ));

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

      if (error) {
        // Rollback
        setEntries(previousEntries);
        toast({
          title: 'Failed to update entry',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Connection error',
        description: 'Unable to reach server. Changes not saved.',
        variant: 'destructive',
      });

      console.error('Update entry error:', errorMessage);
      throw error;
    }
  }, [getSupabase, entries]);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      const supabase = getSupabase();

      // Store for rollback
      const previousEntries = entries;

      // Optimistic update
      setEntries(prev => prev.filter(entry => entry.id !== id));

      const { error } = await supabase
        .from('pain_entries')
        .delete()
        .eq('id', id);

      if (error) {
        // Rollback
        setEntries(previousEntries);
        toast({
          title: 'Failed to delete entry',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Connection error',
        description: 'Unable to reach server. Entry not deleted.',
        variant: 'destructive',
      });

      console.error('Delete entry error:', errorMessage);
      throw error;
    }
  }, [getSupabase, entries]);

  const clearAllEntries = useCallback(async (): Promise<void> => {
    try {
      const user = await getUser();
      const supabase = getSupabase();

      const previousEntries = entries;
      setEntries([]);

      const { error } = await supabase
        .from('pain_entries')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        setEntries(previousEntries);
        toast({
          title: 'Failed to clear entries',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Connection error',
        description: 'Unable to reach server. Entries not cleared.',
        variant: 'destructive',
      });

      console.error('Clear entries error:', errorMessage);
      throw error;
    }
  }, [getUser, getSupabase, entries]);

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

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAllEntries,
    exportToCsv,
  };
}

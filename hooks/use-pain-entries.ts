'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PainEntry, DbPainEntry, NewPainEntry, dbToClient, clientToDb } from '@/types/pain-entry';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

export function usePainEntries() {
  const [entries, setEntries] = useState<PainEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  // Fetch entries on mount and when user changes
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setIsLoaded(true);
      return;
    }

    const fetchEntries = async () => {
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
      setIsLoaded(true);
    };

    fetchEntries();
  }, [user, supabase]);

  const addEntry = useCallback(async (entry: NewPainEntry): Promise<PainEntry> => {
    if (!user) throw new Error('Not authenticated');

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
  }, [user, supabase]);

  const updateEntry = useCallback(async (id: string, updates: Partial<NewPainEntry>): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

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
  }, [user, supabase, entries]);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

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
  }, [user, supabase, entries]);

  const clearAllEntries = useCallback(async (): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

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
  }, [user, supabase, entries]);

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

import { useState, useEffect, useCallback } from 'react';
import { PainEntry } from '@/types/pain-entry';

const STORAGE_KEY = 'painDiary.entries';

function generateId(): string {
  return crypto.randomUUID();
}

export function usePainEntries() {
  const [entries, setEntries] = useState<PainEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load entries:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  const addEntry = useCallback((entry: Omit<PainEntry, 'id' | 'timestamp'>) => {
    const newEntry: PainEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<Omit<PainEntry, 'id'>>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const clearAllEntries = useCallback(() => {
    setEntries([]);
  }, []);

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

  const importFromCsv = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').slice(1); // Skip header
          const imported: PainEntry[] = [];
          
          for (const line of lines) {
            if (!line.trim()) continue;
            const parts = line.match(/(".*?"|[^,]+)/g) || [];
            if (parts.length >= 6) {
              const [date, time, painLevel, locations, types, radiating, ...notesParts] = parts;
              const dateStr = `${date} ${time}`;
              imported.push({
                id: generateId(),
                timestamp: new Date(dateStr).toISOString(),
                painLevel: parseInt(painLevel) || 0,
                locations: locations.split('; ').filter(Boolean),
                types: types.split('; ').filter(Boolean),
                radiating: radiating.toLowerCase() === 'yes',
                notes: notesParts.join(',').replace(/^"|"$/g, '').replace(/""/g, '"'),
              });
            }
          }
          
          setEntries(prev => [...imported, ...prev]);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAllEntries,
    exportToCsv,
    importFromCsv,
  };
}

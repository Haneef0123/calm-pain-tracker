'use client';

import { useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { toast } from '@/hooks/use-toast';
import { Download, Upload, Trash2, Shield } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
    const { entries, exportToCsv, importFromCsv, clearAllEntries } = usePainEntries();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (entries.length === 0) {
            toast({
                title: 'No data to export',
                description: 'Start tracking pain to create data.',
            });
            return;
        }
        exportToCsv();
        toast({
            title: 'Export complete',
            description: `Exported ${entries.length} entries.`,
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await importFromCsv(file);
            toast({
                title: 'Import complete',
                description: 'Your data has been imported.',
            });
        } catch {
            toast({
                title: 'Import failed',
                description: 'Could not read the CSV file.',
                variant: 'destructive',
            });
        }

        // Reset input
        e.target.value = '';
    };

    const handleClearAll = () => {
        clearAllEntries();
        toast({
            title: 'Data cleared',
            description: 'All entries have been deleted.',
        });
    };

    return (
        <PageLayout>
            <div className="pt-8 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-heading">Settings</h1>
                </header>

                <div className="space-y-4">
                    {/* Export */}
                    <Button
                        variant="outline"
                        className="w-full justify-start h-12 bg-card border-border"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4 mr-3" />
                        Export CSV
                    </Button>

                    {/* Import */}
                    <Button
                        variant="outline"
                        className="w-full justify-start h-12 bg-card border-border"
                        onClick={handleImportClick}
                    >
                        <Upload className="w-4 h-4 mr-3" />
                        Import CSV
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="divider my-6" />

                    {/* Clear data */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Clear all data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all {entries.length} pain entries.
                                    Consider exporting your data first. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClearAll}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete all
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Privacy note */}
                <div className="mt-12 p-4 bg-card rounded-sm">
                    <div className="flex gap-3">
                        <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">Privacy</p>
                            <p className="text-label leading-relaxed">
                                All data is stored only on this device. No accounts. No servers. No tracking.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Entry count */}
                <p className="text-center text-label mt-8">
                    {entries.length} entries stored locally
                </p>
            </div>
        </PageLayout>
    );
}

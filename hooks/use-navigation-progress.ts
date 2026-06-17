'use client';

import { useContext } from 'react';
import { NavigationProgressContext } from '@/components/providers/navigation-progress-provider';

export function useNavigationProgress() {
    return useContext(NavigationProgressContext);
}

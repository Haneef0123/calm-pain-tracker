// Educational tips about spine health and pain tracking
// Displayed in rotating carousel when no region is selected

export const SPINE_HEALTH_TIPS = [
  {
    id: 'tip-1',
    icon: '💡',
    title: 'Most Common Sites',
    text: 'L4-L5 and L5-S1 are the most commonly affected lumbar disc levels, often causing sciatica symptoms.',
  },
  {
    id: 'tip-2',
    icon: '📊',
    title: 'Track Patterns',
    text: 'Consistent tracking helps identify triggers. Pain that worsens with sitting often indicates disc involvement.',
  },
  {
    id: 'tip-3',
    icon: '🔍',
    title: 'Sensations Matter',
    text: 'Burning or tingling sensations often indicate nerve irritation. This information helps your doctor assess severity.',
  },
  {
    id: 'tip-4',
    icon: '⏰',
    title: 'Time of Day',
    text: 'Morning stiffness vs evening pain can indicate different causes. Your entries are timestamped automatically.',
  },
  {
    id: 'tip-5',
    icon: '🎯',
    title: 'Primary Disc',
    text: 'Mark your most painful disc as primary. This helps track which level is causing the most issues over time.',
  },
  {
    id: 'tip-6',
    icon: '📈',
    title: 'See Your Progress',
    text: 'Check the Patterns page to visualize your pain trends over 7 days, 30 days, or all time.',
  },
  {
    id: 'tip-7',
    icon: '🩺',
    title: 'For Your Doctor',
    text: 'Detailed pain logs with radiation paths and aggravating factors help doctors make better treatment decisions.',
  },
  {
    id: 'tip-8',
    icon: '🧠',
    title: 'Cervical Discs',
    text: 'C5-C6 and C6-C7 are the most common cervical levels affected, often causing arm and hand symptoms.',
  },
] as const;

export type SpineHealthTip = (typeof SPINE_HEALTH_TIPS)[number];

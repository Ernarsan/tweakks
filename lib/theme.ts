export const Theme = {
  colors: {
    bg: '#0B0F19',
    card: '#131B2E',
    cardElevated: '#1A233A',
    cardBorder: '#232E48',
    cardBorderHover: '#3B4B70',
    
    // Text
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    
    // Accents
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    
    // Badges & Pills
    badgeNotStartedBg: '#1E293B',
    badgeNotStartedText: '#94A3B8',
    badgeNotStartedDot: '#64748B',
    
    badgeInProgressBg: 'rgba(99, 102, 241, 0.15)',
    badgeInProgressText: '#818CF8',
    badgeInProgressDot: '#6366F1',
    
    badgeCompletedBg: 'rgba(16, 185, 129, 0.15)',
    badgeCompletedText: '#34D399',
    badgeCompletedDot: '#10B981',

    // Gradients
    gradients: {
      primary: ['#6366F1', '#8B5CF6'] as [string, string],
      success: ['#10B981', '#059669'] as [string, string],
      warning: ['#F59E0B', '#D97706'] as [string, string],
      danger: ['#EF4444', '#DC2626'] as [string, string],
      card: ['#141D32', '#0E1626'] as [string, string],
      cardGlow: ['rgba(99, 102, 241, 0.12)', 'rgba(139, 92, 246, 0.02)'] as [string, string],
    }
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  shadows: {
    glowPrimary: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    glowSuccess: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 4,
    }
  }
};

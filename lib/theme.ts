// Дизайн-система на основе Tailwind v4, 21st.dev и Aceternity UI

export const THEME = {
  colors: {
    // Базовые фоны
    background: '#F8FAFC',
    backgroundSubtle: '#F1F5F9',
    card: '#FFFFFF',
    cardHover: '#F8FAFC',

    // Темная эстетика Aceternity (для акцентных блоков и бейджей)
    surfaceDark: '#0F172A',
    surfaceDarkCard: '#1E293B',

    // Текст
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    // Границы
    border: 'rgba(148, 163, 184, 0.2)',
    borderActive: 'rgba(99, 102, 241, 0.4)',
    borderDark: 'rgba(255, 255, 255, 0.08)',

    // Основной градиент Aceternity (Indigo -> Violet)
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#EEF2FF',
    secondary: '#8B5CF6',

    // Семантические статусы
    success: '#10B981',
    successLight: '#ECFDF5',
    successBorder: 'rgba(16, 185, 129, 0.25)',

    inProgress: '#0EA5E9',
    inProgressLight: '#F0F9FF',
    inProgressBorder: 'rgba(14, 165, 233, 0.25)',

    notStarted: '#94A3B8',
    notStartedLight: '#F1F5F9',
    notStartedBorder: 'rgba(148, 163, 184, 0.25)',

    warning: '#F59E0B',
    warningLight: '#FFFBEB',

    destructive: '#F43F5E',
    destructiveLight: '#FFF1F2',
  },

  radii: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 28,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    cardElevated: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 4,
    },
    glowIndigo: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    glowEmerald: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
  },

  animation: {
    spring: {
      stiffness: 300,
      damping: 24,
      useNativeDriver: true,
    },
    springBouncy: {
      stiffness: 450,
      damping: 18,
      useNativeDriver: true,
    },
    snappy: {
      duration: 180,
      useNativeDriver: true,
    },
  },
};

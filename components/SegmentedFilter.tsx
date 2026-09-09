import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { TaskStatus } from '../lib/db';
import { THEME } from '../lib/theme';

export type FilterType = 'all' | TaskStatus;

interface SegmentedFilterProps {
  filters: { key: FilterType; label: string; count?: number }[];
  currentFilter: FilterType;
  onSelect: (filter: FilterType) => void;
}

export const SegmentedFilter: React.FC<SegmentedFilterProps> = ({
  filters,
  currentFilter,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((f) => {
          const isActive = currentFilter === f.key;

          return (
            <Pressable
              key={f.key}
              onPress={() => onSelect(f.key)}
              style={[
                styles.chip,
                isActive && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}
              >
                {f.label}
              </Text>
              {f.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isActive ? styles.countBadgeActive : styles.countBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isActive ? styles.countTextActive : styles.countTextInactive,
                    ]}
                  >
                    {f.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radii.full,
    backgroundColor: THEME.colors.backgroundSubtle,
    gap: 6,
  },
  chipActive: {
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.glowIndigo,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  chipTextActive: {
    color: THEME.colors.textInverse,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: THEME.radii.full,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  countTextInactive: {
    color: THEME.colors.textSecondary,
  },
});

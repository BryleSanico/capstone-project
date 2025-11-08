// src/components/ScreenHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  rightContent,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
          {/* If rightContent is provided, render it */}
          {rightContent ? rightContent : <View style={styles.placeholder} />}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 0,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        marginTop: 0,
      },
      android: {
        elevation: 8,
        marginVertical: 0,
      },
    }),
  },
  headerGradient: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  headerContent: {
    marginTop: Platform.OS === "ios" ? 60 : 25,
    marginBottom: 25,
    marginHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  // Placeholder to keep title aligned left when no right content exists
  placeholder: {
    width: 56, 
    height: 56,
  },
});

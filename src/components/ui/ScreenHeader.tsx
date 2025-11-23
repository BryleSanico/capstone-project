// src/components/ScreenHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function ScreenHeader({
  title,
  subtitle,
  rightContent,
  showBackButton,
  onBack,
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
          <View style={styles.leftContainer}>
            {showBackButton && (
              <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
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
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
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
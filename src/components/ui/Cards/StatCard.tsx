import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface StatCardProps {
  title: string;
  value: string | number | undefined;
  icon: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.iconBg]}>
      <Icon name={icon} size={60} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value ?? '-'}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
        textAlign: 'center',
  },
});
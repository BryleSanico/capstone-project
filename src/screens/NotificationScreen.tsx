import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../navigation/AppNavigator';
import ScreenHeader from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/Errors/EmptyState';
import { Loader } from '../components/LazyLoaders/loader';
import {
  useNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} from '../hooks/useNotifications';
import { formatFullDate } from '../utils/formatters/dateFormatter';
import { AppNotification } from '../services/api/notificationService';

type NotificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NotificationScreen() {
  const navigation = useNavigation<NotificationScreenNavigationProp>();
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotificationsQuery();
  const { mutate: markRead } = useMarkReadMutation();
  const { mutate: markAllRead } = useMarkAllReadMutation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handlePress = (item: AppNotification) => {
    if (!item.is_read) {
      markRead(item.id);
    }
    // If it's an event rejection, navigate to the edit form
    if (item.event_id && item.type === 'error') {
      navigation.navigate('EventForm', { eventId: item.event_id });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return { name: 'alert-circle', color: '#ef4444' };
      case 'success': return { name: 'checkmark-circle', color: '#10b981' };
      case 'warning': return { name: 'warning', color: '#f59e0b' };
      default: return { name: 'information-circle', color: '#6366f1' };
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const iconData = getIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.unreadCard]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Icon name={iconData.name} size={24} color={iconData.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMessage} numberOfLines={3}>{item.message}</Text>
          <Text style={styles.dateText}>{formatFullDate(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const headerRight = (
    <TouchableOpacity onPress={() => markAllRead()} style={styles.readAllBtn}>
      <Icon name="checkmark-done-outline" size={24} color="#fff" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        subtitle="Updates on your events"
        rightContent={headerRight}
        showBackButton={true}
        onBack={() => navigation.goBack()}
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No Notifications"
          message="You're all caught up!"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'flex-start',
  },
  unreadCard: {
    backgroundColor: '#f0fdf4', // Very light green tint for unread, or just white
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginLeft: 8,
    marginTop: 6,
  },
  readAllBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  }
});
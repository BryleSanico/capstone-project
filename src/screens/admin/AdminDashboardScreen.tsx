import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { Loader } from "../../components/LazyLoaders/loader";
import { useAuth } from "../../stores/auth-store";
import { useAdminStats, useAdminLogs } from "../../hooks/";
import { StatCard } from "../../components/ui/Cards/StatCard";
import { RecentLogsCard } from "../../components/ui/Cards/RecentLogsCard";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AdminStackParamList } from "../../navigation/AdminNavigator";
import { Colors } from "../../constants/colors";

type AdminDashboardNavigationProp =
  NativeStackNavigationProp<AdminStackParamList>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminDashboardNavigationProp>();
  const { user, role, signOut } = useAuth();

  // Fetch Stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
    isRefetching: isRefetchingStats,
  } = useAdminStats();

  // Fetch Recent Logs
  const {
    data: logs = [],
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
    isRefetching: isRefetchingLogs,
  } = useAdminLogs();

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const isLoading = isLoadingStats || isLoadingLogs;
  const isRefetching = isRefetchingStats || isRefetchingLogs;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>
              Hello, {role === "super_admin" ? "Super Admin" : "Admin"}
            </Text>
            <Text style={styles.name}>{user?.user_metadata.full_name}</Text>
          </View>
          <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
            <Icon name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <StatCard
            title="Total Users"
            value={stats?.total_users}
            icon="people"
            color="#6366f1"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats?.total_revenue ?? 0}`}
            icon="cash"
            color="#10b981"
          />
          <StatCard
            title="Pending Events"
            value={stats?.pending_events}
            icon="time"
            color="#f59e0b"
          />
          <StatCard
            title="Total Events"
            value={stats?.total_events}
            icon="calendar"
            color="#3b82f6"
          />
        </View>

        {/* New Logs Card */}
        <RecentLogsCard
          logs={logs}
          onShowAll={() => navigation.navigate("AdminLogs")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  content: { padding: 20, paddingBottom: 40 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: Colors.gray500,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  name: { fontSize: 24, fontWeight: "bold", color: Colors.gray800 },

  logoutIconBtn: {
    padding: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 24 },
});

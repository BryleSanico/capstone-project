import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { Loader } from "../../components/LazyLoaders/loader";
import { useAuth } from "../../stores/auth-store";
import { useAdminStats } from "../../hooks/useAdmin";

export default function AdminDashboardScreen() {
  const { user, role, signOut } = useAuth();

  // REACT QUERY DATA FETCHING
  const { data: stats, isLoading, refetch, isRefetching } = useAdminStats();

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconBg, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value ?? "-"}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {role === "super_admin" ? "Super Admin" : "Admin"}
          </Text>
          <Text style={styles.name}>{user?.user_metadata.full_name}</Text>
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

        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()}>
          <Icon name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  greeting: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 8,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  statTitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
  },
  logoutText: { color: "#ef4444", fontWeight: "600", marginLeft: 8 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});

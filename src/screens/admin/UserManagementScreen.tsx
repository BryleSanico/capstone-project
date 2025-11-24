import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loader } from "../../components/LazyLoaders/loader";
import Icon from "react-native-vector-icons/Ionicons";
import { useAuth } from "../../stores/auth-store";
import { useAllUsers, useUpdateUserRole } from "../../hooks/useAdmin";

export default function UserManagementScreen() {
  const { user: currentUser } = useAuth();

  // REACT QUERY DATA FETCHING
  const { data: users = [], isLoading, refetch, isRefetching } = useAllUsers();
  const roleMutation = useUpdateUserRole();

  const handleRoleChange = (userEmail: string, currentRole: string) => {
    Alert.alert("Change Role", `Select new role for ${userEmail}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Make User",
        onPress: () => roleMutation.mutate({ email: userEmail, role: "user" }),
        style: currentRole === "user" ? "default" : "destructive",
      },
      {
        text: "Make Admin",
        onPress: () => roleMutation.mutate({ email: userEmail, role: "admin" }),
      },
      {
        text: "Make Super Admin",
        onPress: () =>
          roleMutation.mutate({ email: userEmail, role: "super_admin" }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
      </View>
    );
  }

  const renderUser = ({ item }: any) => {
    const isMe = item.email === currentUser?.email;

    return (
      <View style={styles.userRow}>
        <View style={styles.leftSection}>
          <View style={styles.avatarPlaceholder}>
            <Icon name="person" size={20} color="#6366f1" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.full_name || "No Name"} {isMe && "(You)"}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.roleBadge,
            item.role === "super_admin"
              ? styles.bgSuper
              : item.role === "admin"
              ? styles.bgAdmin
              : styles.bgUser,
          ]}
          onPress={() => !isMe && handleRoleChange(item.email, item.role)}
          disabled={isMe || roleMutation.isPending}
        >
          <Text
            style={[
              styles.roleText,
              item.role === "super_admin" ? styles.textSuper : styles.textAdmin,
            ]}
          >
            {item.role}
          </Text>
          {!isMe && (
            <Icon
              name="chevron-down"
              size={12}
              color="#6b7280"
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>User Management</Text>
      <Text style={styles.subtitle}>Super Admin Privilege</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
      />
      {roleMutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#6366f1" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 20,
    paddingTop: 20,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6366f1",
    paddingHorizontal: 20,
    marginBottom: 10,
    fontWeight: "600",
  },
  list: { padding: 20 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  leftSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: { flex: 1, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  userEmail: { fontSize: 13, color: "#6b7280" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bgSuper: { backgroundColor: "#fef3c7" },
  bgAdmin: { backgroundColor: "#dbeafe" },
  bgUser: { backgroundColor: "#f3f4f6" },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "capitalize",
  },
  textSuper: { color: "#d97706" },
  textAdmin: { color: "#2563eb" },
  loadingOverlay: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});

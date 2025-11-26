import React, { useState, useMemo } from "react";
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
import { Loader } from "../../components/LazyLoaders/loader";
import Icon from "react-native-vector-icons/Ionicons";
import { useAuth } from "../../stores/auth-store";
import { useUsersInfiniteQuery, useUpdateUserRole } from "../../hooks/useAdmin";
import ScreenHeader from "../../components/ui/ScreenHeader";
import SearchBar from "../../components/ui/SearchBar";
import { useDebounce } from "../../hooks/useDebounce";
import TabSelector, { TabItem } from "../../components/navigation/TabSelector";

// Tab Constants
const TAB_ALL = "all";
const TAB_ADMINS = "admins";
const TAB_USERS = "users";

export default function UserManagementScreen() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>(TAB_ALL);
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Use Infinite Query
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useUsersInfiniteQuery(debouncedQuery);

  const roleMutation = useUpdateUserRole();

  // Flatten data pages
  const allUsers = data?.pages.flatMap((page) => page.users) ?? [];

  // Filter users based on selected tab
  const filteredUsers = useMemo(() => {
    if (selectedTab === TAB_ADMINS) {
      return allUsers.filter(
        (user) => user.role === "admin" || user.role === "super_admin"
      );
    } else if (selectedTab === TAB_USERS) {
      return allUsers.filter((user) => user.role === "user");
    }
    return allUsers;
  }, [allUsers, selectedTab]);

  // Calculate counts for tabs
  const adminCount = allUsers.filter(
    (user) => user.role === "admin" || user.role === "super_admin"
  ).length;
  const userCount = allUsers.filter((user) => user.role === "user").length;

  const tabs: TabItem[] = [
    { key: TAB_ALL, title: "All", count: allUsers.length },
    { key: TAB_ADMINS, title: "Admins", count: adminCount },
    { key: TAB_USERS, title: "Users", count: userCount },
  ];

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

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
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
    <View style={styles.container}>
      <ScreenHeader
        title="User Management"
        subtitle="Manage permissions and roles"
      />

      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => {}} // Optional: Add filter logic later if needed
        />
      </View>

      <TabSelector
        tabs={tabs}
        selectedTabKey={selectedTab}
        onSelectTab={setSelectedTab}
      />

      <FlatList
        data={filteredUsers}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No users found matching "{searchQuery}"
            </Text>
          </View>
        }
      />
      {roleMutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#6366f1" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  list: { padding: 20 },

  searchWrapper: {
    marginTop: 8,
    marginBottom: 0, // Reduced margin since tab selector adds spacing
  },

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
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#6b7280", fontSize: 16 },
  footerLoader: { paddingVertical: 20, alignItems: "center" },
});

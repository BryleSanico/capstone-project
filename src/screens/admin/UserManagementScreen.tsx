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
import {
  useUsersInfiniteQuery,
  useUpdateUserRole,
  useBanUser,
} from "../../hooks/";
import ScreenHeader from "../../components/ui/ScreenHeader";
import SearchBar from "../../components/ui/SearchBar";
import { useDebounce } from "../../hooks/";
import TabSelector, { TabItem } from "../../components/navigation/TabSelector";
import { AdminUser } from "../../types/admin";
import { Colors } from "../../constants/colors";

// Tab Constants
const TAB_ALL = "all";
const TAB_ADMINS = "admins";
const TAB_USERS = "users";
const TAB_BANNED = "banned";

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
  const banMutation = useBanUser();

  const allUsers = useMemo(() => {
    return data?.pages.flatMap((page) => page.users) ?? [];
  }, [data]);

  // Filter users based on selected tab
  const filteredUsers = useMemo(() => {
    if (selectedTab === TAB_ADMINS) {
      return allUsers.filter(
        (user) => user.role === "admin" || user.role === "super_admin"
      );
    } else if (selectedTab === TAB_USERS) {
      return allUsers.filter((user) => user.role === "user");
    } else if (selectedTab === TAB_BANNED) {
      return allUsers.filter((user) => !!user.banned_until);
    }
    return allUsers;
  }, [allUsers, selectedTab]);

  // Calculate counts for tabs
  const adminCount = allUsers.filter(
    (user) => user.role === "admin" || user.role === "super_admin"
  ).length;
  const userCount = allUsers.filter((user) => user.role === "user").length;
  const bannedCount = allUsers.filter((user) => !!user.banned_until).length;

  const tabs: TabItem[] = [
    { key: TAB_ALL, title: "All", count: allUsers.length },
    { key: TAB_ADMINS, title: "Admins", count: adminCount },
    { key: TAB_USERS, title: "Users", count: userCount },
    { key: TAB_BANNED, title: "Banned", count: bannedCount },
  ];

  const handleUserAction = (user: AdminUser) => {
    const isBanned = !!user.banned_until; // Check if banned

    Alert.alert("Manage User", `Select action for ${user.email}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Set as User",
        onPress: () => roleMutation.mutate({ email: user.email, role: "user" }),
      },
      {
        text: "Promote to Admin",
        onPress: () =>
          roleMutation.mutate({ email: user.email, role: "admin" }),
      },
      {
        text: "Promote to Super Admin",
        onPress: () =>
          roleMutation.mutate({ email: user.email, role: "super_admin" }),
      },
      {
        text: isBanned ? "Unban User" : "Ban User (Indefinite)",
        onPress: () =>
          banMutation.mutate({
            email: user.email,
            banUntil: isBanned ? null : "2099-01-01 00:00:00+00", // Toggle Ban
          }),
        style: "destructive",
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

  // Helper to determine styles based on status
  const getRoleStyle = (user: AdminUser) => {
    if (user.banned_until) return styles.bgBanned;
    switch (user.role) {
      case "super_admin":
        return styles.bgSuper;
      case "admin":
        return styles.bgAdmin;
      default:
        return styles.bgUser;
    }
  };

  const getRoleTextStyle = (user: AdminUser) => {
    if (user.banned_until) return styles.textBanned;
    switch (user.role) {
      case "super_admin":
        return styles.textSuper;
      case "admin":
        return styles.textAdmin;
      default:
        return styles.textUser;
    }
  };

  const renderUser = ({ item }: { item: AdminUser }) => {
    const isMe = item.email === currentUser?.email;
    const isBanned = !!item.banned_until;

    return (
      <View style={[styles.userRow, isBanned && styles.bannedRow]}>
        <View style={styles.leftSection}>
          <View
            style={[styles.avatarPlaceholder, isBanned && styles.bannedAvatar]}
          >
            <Icon
              name={isBanned ? "ban" : "person"}
              size={20}
              color={isBanned ? "#ef4444" : "#6366f1"}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, isBanned && styles.bannedUserName]}>
              {item.full_name || "No Name"} {isMe && "(You)"}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.roleBadge, getRoleStyle(item)]}
          onPress={() => !isMe && handleUserAction(item)}
          disabled={isMe || roleMutation.isPending || banMutation.isPending}
        >
          <Text style={[styles.roleText, getRoleTextStyle(item)]}>
            {isBanned ? "Banned" : item.role}
          </Text>
          {!isMe && (
            <Icon
              name="chevron-down"
              size={12}
              color={isBanned ? "#ef4444" : "#6b7280"}
              style={styles.chevronIcon}
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
          onFilterPress={() => {}}
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
              No users found matching &ldquo;{searchQuery}&rdquo;
            </Text>
          </View>
        }
      />
      {(roleMutation.isPending || banMutation.isPending) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#6366f1" />
        </View>
      )}
    </View>
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
  list: { padding: 20 },

  searchWrapper: {
    marginTop: 8,
    marginBottom: 0,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bannedRow: {
    backgroundColor: Colors.offlineAlt,
    opacity: 0.9,
  },
  leftSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.infoBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bannedAvatar: {
    backgroundColor: "#fee2e2",
  },
  userInfo: { flex: 1, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: "600", color: Colors.gray800 },
  bannedUserName: {
    color: Colors.gray400,
    textDecorationLine: "line-through",
  },
  userEmail: { fontSize: 13, color: Colors.gray500 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bgSuper: { backgroundColor: Colors.roleSuperBg },
  bgAdmin: { backgroundColor: Colors.roleAdminBg },
  bgUser: { backgroundColor: Colors.roleUserBg },
  bgBanned: {
    backgroundColor: Colors.roleBannedBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gray700,
    textTransform: "capitalize",
  },
  textSuper: { color: Colors.roleSuper },
  textAdmin: { color: Colors.roleAdmin },
  textUser: { color: Colors.roleUser },
  textBanned: { color: Colors.roleBanned },
  chevronIcon: {
    marginLeft: 4,
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 20,
    elevation: 5,
  },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: Colors.gray500, fontSize: 16 },
  footerLoader: { paddingVertical: 20, alignItems: "center" },
});

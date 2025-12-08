import React, { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import { getIconComponent } from "../utils/ui/iconLoader";
import { MenuItem } from "../types/menu";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigation/TabNavigator";
import { RootStackParamList } from "../navigation/AppNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../stores/auth-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppCacheService } from "../services/AppCacheService";
import { useTicketsQuery } from "../hooks/";
import { useFavoritesQuery } from "../hooks/";
import { useUnreadCountQuery } from "../hooks/";
import { Colors } from "../constants/colors";
import { logger } from "../utils/system/logger";

// Define the types for route and navigation
type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, signOut } = useAuth();

  // REACT QUERY DATA FETCHING
  const { data: tickets = [] } = useTicketsQuery();
  const { data: favoriteEventIds = [] } = useFavoritesQuery();
  // Only fetch unread count if user is logged in
  const { data: unreadCount = 0 } = useUnreadCountQuery();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Profile",
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
    });
  }, [navigation, user]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await signOut();
          } catch (error) {
            logger.error("Logout failed:", error);
            Alert.alert("Error", "Could not log out. Please try again.");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const handleClearStorage = async () => {
    Alert.alert(
      "Clear Storage",
      "This will clear all secure storage and app cache. Use for development only. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AppCacheService.clearAllSecureStorage();
              await AsyncStorage.clear();
              Alert.alert(
                "Success",
                "All storage cleared. Please restart the app."
              );
            } catch (error) {
              logger.error("Failed to clear storage:", error);
              Alert.alert("Error", "Failed to clear storage");
            }
          },
        },
      ]
    );
  };

  // Define base items visible to everyone (or guests)
  const baseMenuItems: MenuItem[] = [
    {
      icon: { name: "settings-outline", library: "Ionicons" },
      title: "Settings",
      subtitle: "App preferences and privacy",
      onPress: () => logger.info("Settings"),
    },
    {
      icon: { name: "help-circle-outline", library: "Ionicons" },
      title: "Help & Support",
      subtitle: "Get help with your account",
      onPress: () => logger.info("Help"),
    },
  ];

  // Define items visible ONLY to logged-in users
  const userMenuItems: MenuItem[] = [
    {
      icon: { name: "bell-o", library: "FontAwesome" },
      title: "Notifications",
      subtitle:
        unreadCount > 0
          ? `${unreadCount} new updates`
          : "Manage your event reminders",
      onPress: () => navigation.navigate("Notifications"),
    },
    {
      icon: { name: "heart-o", library: "FontAwesome" },
      title: "Favorite Events",
      subtitle: `${favoriteEventIds.length} events saved`,
      onPress: () => navigation.navigate("Favorites"),
    },
  ];

  // Merge lists based on auth state
  const menuItems = user ? [...userMenuItems, ...baseMenuItems] : baseMenuItems;

  // Dev-only item
  if (__DEV__) {
    menuItems.push({
      icon: { name: "trash-outline", library: "Ionicons" },
      title: "Clear All Storage (Dev)",
      subtitle: "Remove all secure data",
      onPress: handleClearStorage,
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeaderWrapper}>
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            style={styles.profileHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarContainer}>
              <FontAwesomeIcon name="user" size={40} color="#fff" />
            </View>
            <Text style={styles.userName}>
              {user?.user_metadata.full_name || "Guest"}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || "Login to see your details"}
            </Text>
          </LinearGradient>
        </View>

        {/* Only show Stats Container if logged in */}
        {user && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="ticket-outline" size={24} color={Colors.primary} />
              <Text style={styles.statNumber}>{tickets.length}</Text>
              <Text style={styles.statLabel}>Tickets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <FontAwesomeIcon name="heart-o" size={24} color={Colors.error} />
              <Text style={styles.statNumber}>{favoriteEventIds.length}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const IconComponent = getIconComponent(item.icon.library);
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuIcon}>
                  <IconComponent
                    name={item.icon.name}
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {user ? (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut} // Disable button while logging out
          >
            {isLoggingOut ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <>
                <Icon name="exit-outline" size={20} color={Colors.error} />
                <Text style={styles.logoutText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  profileHeaderWrapper: {
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.whiteTransparent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 25,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.whiteTransparent80,
    marginBottom: 25,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 8,
    minHeight: 50,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});

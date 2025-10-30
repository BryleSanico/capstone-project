// src/screens/ProfileScreen.tsx
import React, { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import { getIconComponent } from "../utils/iconLoader";
import { MenuItem } from "../types/menu";
import { useTickets } from "../stores/tickets-store";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigation/TabNavigator";
import { RootStackParamList } from "../navigation/AppNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../stores/auth-store";
import { useFavorites } from "../stores/favorites-store";
import { transparent } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { tickets } = useTickets();
  const { favorites } = useFavorites();
  const { user, signOut } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Profile",
      headerStyle: { backgroundColor: "#fff" },
      headerTitleStyle: { fontWeight: "700", fontSize: 20 },
    });
  }, [navigation]);

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
            console.error("Logout failed:", error);
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

  const menuItems: MenuItem[] = [
    {
      icon: { name: "bell-o", library: "FontAwesome" },
      title: "Notifications",
      subtitle: "Manage your event reminders",
      onPress: () => console.log("Notifications"),
    },
    {
      icon: { name: "heart-o", library: "FontAwesome" },
      title: "Favorite Events",
      subtitle: `${favorites.length} events saved`,
      onPress: () => navigation.navigate("Favorites"),
    },
    {
      icon: { name: "settings-outline", library: "Ionicons" },
      title: "Settings",
      subtitle: "App preferences and privacy",
      onPress: () => console.log("Settings"),
    },
    {
      icon: { name: "help-circle-outline", library: "Ionicons" },
      title: "Help & Support",
      subtitle: "Get help with your account",
      onPress: () => console.log("Help"),
    },
  ];

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
              {user?.email || "guest@example.com"}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="ticket-outline" size={24} color="#6366f1" />
            <Text style={styles.statNumber}>{tickets.length}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesomeIcon name="heart-o" size={24} color="#ff4757" />
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const IconComponent = getIconComponent(item.icon.library);
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                disabled={!user} // Disable if not logged in
              >
                <View style={styles.menuIcon}>
                  <IconComponent
                    name={item.icon.name}
                    size={20}
                    color="#6366f1"
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
              <ActivityIndicator color="#ff4757" />
            ) : (
              <>
                <Icon name="exit-outline" size={20} color="#ff4757" />
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
    backgroundColor: "#f8f9fa",
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
        shadowColor: "#6366f1",
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
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 25,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 25,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
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
    backgroundColor: "#f0f0f0",
    marginHorizontal: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
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
    borderBottomColor: "#f8f9fa",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
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
    color: "#1a1a1a",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff4757",
    gap: 8,
    minHeight: 50, // for loader
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff4757",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

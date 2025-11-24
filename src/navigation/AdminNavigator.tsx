import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import EventApprovalsScreen from "../screens/admin/EventApprovalsScreen";
import UserManagementScreen from "../screens/admin/UserManagementScreen";
import { useAuth } from "../stores/auth-store";

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  const { role } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 15,
          paddingRight: 15,
          height: 75,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={EventApprovalsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="checkmark-done-circle" size={size} color={color} />
          ),
        }}
      />
      {role === "super_admin" && (
        <Tab.Screen
          name="Users"
          component={UserManagementScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="people" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

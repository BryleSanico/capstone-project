import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import EventApprovalsScreen from "../screens/admin/EventApprovalsScreen";
import UserManagementScreen from "../screens/admin/UserManagementScreen";

import { useAuth } from "../stores/auth-store";
import { Colors } from "../constants/colors";

// Types
export type AdminTabParamList = {
  Dashboard: undefined;
  Approvals: undefined;
  Users: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

// Render functions extracted outside to prevent instability
const renderDashboardIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => <Icon name="stats-chart" size={size} color={color} />;

const renderApprovalsIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => <Icon name="checkmark-done-circle" size={size} color={color} />;

const renderUsersIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="people" size={size} color={color} />
);

// Tab Navigator (Dashboard, Approvals, Users)
export default function AdminTabNavigator() {
  const { role } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
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
          tabBarIcon: renderDashboardIcon,
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={EventApprovalsScreen}
        options={{
          tabBarIcon: renderApprovalsIcon,
        }}
      />
      {role === "super_admin" && (
        <Tab.Screen
          name="Users"
          component={UserManagementScreen}
          options={{
            tabBarIcon: renderUsersIcon,
          }}
        />
      )}
    </Tab.Navigator>
  );
}

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import Icon2 from "react-native-vector-icons/FontAwesome";
import DiscoverScreen from "../screens/DiscoverScreen";
import TicketsScreen from "../screens/TicketScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MyEventsScreen from "../screens/MyEventsScreen";
import { useAuth } from "../stores/auth-store";

export type TabParamList = {
  Discover: undefined;
  "My Events": undefined;
  "My Tickets": undefined;
  Profile: undefined;
};
const Tab = createBottomTabNavigator<TabParamList>();

//  Extracted render functions
const renderDiscoverIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => <Icon name="search-outline" size={size} color={color} />;

const renderMyEventsIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => <Icon name="calendar-outline" size={size} color={color} />;

const renderMyTicketsIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => <Icon name="ticket-outline" size={size} color={color} />;

const renderProfileIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => <Icon2 name="user-o" size={size} color={color} />;

export default function TabNavigator() {
  const { session } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#999",
        headerShown: true,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 15,
          paddingRight: 15,
          height: 75,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
          textAlign: "center",
        },
        tabBarItemStyle: {
          flex: 1,
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: "Discover",
          tabBarIcon: renderDiscoverIcon,
        }}
      />
      {session && (
        <>
          <Tab.Screen
            name="My Events"
            component={MyEventsScreen}
            options={{
              tabBarLabel: "My Events",
              tabBarIcon: renderMyEventsIcon,
            }}
          />
          <Tab.Screen
            name="My Tickets"
            component={TicketsScreen}
            options={{
              tabBarLabel: "My Tickets",
              tabBarIcon: renderMyTicketsIcon,
            }}
          />
        </>
      )}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: renderProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
}

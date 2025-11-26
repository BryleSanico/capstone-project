import {
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { TabParamList } from "./TabNavigator";
import TabNavigator from "./TabNavigator";
import EventDetailsScreen from "../screens/EventDetailsScreen";
import TicketDetailsScreen from "../screens/TicketDetailsScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import EventFormScreen from "../screens/EventFormScreen";
import NotificationScreen from "../screens/NotificationScreen";

// This is the heart of your type-safe navigation
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  EventDetails: { id: number; initialIsFavorite: boolean };
  TicketDetails: { id: number };
  Favorites: undefined;
  Login: undefined;
  Register: undefined;
  EventForm: { eventId?: number };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} 
      options={{
          headerTintColor: 'black', // Changes back button and title color to red
        }}/>
      <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      <Stack.Screen name="EventForm" component={EventFormScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
}

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

interface EmptyStateProps {
  hasAction?: boolean;
  actionText?: string;
  icon: string;
  title: string;
  message: string;
  navigateTo?: string;
}

const renderEmptyState = (icon: string, title: string, message: string) => (
  <View style={styles.emptyState}>
    <Icon name={icon} size={64} color="#ccc" />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{message}</Text>
  </View>
);

const renderEmptyStateWithAction = (
  icon: string,
  title: string,
  message: string,
  actionText: string,
  onPress: () => void
) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Icon name={icon} size={64} color="#e0e0e0" />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{message}</Text>
    <TouchableOpacity style={styles.exploreButton} onPress={onPress}>
      <Text style={styles.exploreButtonText}>{actionText}</Text>
    </TouchableOpacity>
  </View>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasAction = false,
  actionText = "Button",
  navigateTo,
  icon,
  title,
  message,
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (navigateTo) {
      navigation.navigate(navigateTo as never);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {hasAction
        ? renderEmptyStateWithAction(icon, title, message, actionText, handlePress)
        : renderEmptyState(icon, title, message)}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  exploreButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 20,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

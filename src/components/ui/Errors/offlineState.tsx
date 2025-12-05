import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Colors } from "../../../constants/colors";

interface OfflineStateProps {
  message: string;
  onRefresh: () => void;
}

export const OfflineState: React.FC<OfflineStateProps> = ({
  message,
  onRefresh,
}) => {
  return (
    <View style={styles.centerContainer}>
      <Icon name="cloud-offline-outline" size={64} color="#ccc" />
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorText}>{message}</Text>
      <Text style={styles.errorText} onPress={onRefresh}>
        Tap to retry
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
});

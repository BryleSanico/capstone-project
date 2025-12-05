import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { AdminLog } from "../../../types/admin";
import { formatRelativeTime } from "../../../utils/formatters/relativeTimeFormatter";
import { getActionConfig } from "../../../utils/ui/adminLogConfig";
import { Colors } from "../../../constants/colors";

interface RecentLogsCardProps {
  logs: AdminLog[];
  onShowAll: () => void;
}

export const RecentLogsCard: React.FC<RecentLogsCardProps> = ({
  logs,
  onShowAll,
}) => {
  const renderLogItem = (log: AdminLog, index: number) => {
    const config = getActionConfig(log.action_type);

    // Clean up details text
    let displayDetail = log.details;
    if (displayDetail.startsWith("Reason: ")) {
      displayDetail = "Action taken. " + displayDetail;
    }

    return (
      <View
        key={log.id}
        style={[
          styles.logRow,
          index !== logs.length - 1 && styles.borderBottom,
        ]}
      >
        <View
          style={[styles.iconBox, { backgroundColor: `${config.color}15` }]}
        >
          <Icon name={config.icon} size={16} color={config.color} />
        </View>
        <View style={styles.logContent}>
          <Text style={styles.logTitle}>{config.title}</Text>
          <Text style={styles.logDetail} numberOfLines={2}>
            {displayDetail}
          </Text>
          <Text style={styles.logMeta}>
            {log.admin_name || "Admin"} • {formatRelativeTime(log.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity onPress={onShowAll} style={styles.headerLink}>
          <Text style={styles.headerLinkText}>Show All</Text>
          <Icon name="arrow-forward" size={14} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity.</Text>
        ) : (
          logs.slice(0, 5).map(renderLogItem)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.gray800,
  },
  headerLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    marginRight: 4,
  },
  list: {
    paddingHorizontal: 16,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray900,
    marginBottom: 2,
  },
  logDetail: {
    fontSize: 13,
    color: Colors.gray600,
    marginBottom: 4,
    lineHeight: 18,
  },
  logMeta: {
    fontSize: 11,
    color: Colors.gray400,
  },
  emptyText: {
    padding: 20,
    textAlign: "center",
    color: Colors.gray400,
    fontStyle: "italic",
  },
});

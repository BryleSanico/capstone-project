import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { Loader } from "../../components/LazyLoaders/loader";
import { useAdminLogs } from "../../hooks/useAdmin";
import {
  formatFullDate,
  formatTime,
} from "../../utils/formatters/dateFormatter";
import { AdminLog } from "../../types/admin";
import { EmptyState } from "../../components/ui/Errors/EmptyState";
import { formatRelativeTime } from "../../utils/formatters/relativeTimeFormatter";

export default function AdminLogsScreen() {
  const { data: logs = [], isLoading, refetch, isRefetching } = useAdminLogs();
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

  const getActionConfig = (type: string) => {
    switch (type) {
      case "APPROVE_EVENT":
        return {
          icon: "checkmark-circle",
          color: "#10b981",
          label: "Event Approved",
        };
      case "REJECT_DELETE":
        return { icon: "trash", color: "#ef4444", label: "Event Deleted" };
      case "REJECT_REVISION":
        return {
          icon: "construct",
          color: "#f59e0b",
          label: "Revision Requested",
        };
      case "PROMOTE_USER":
        return { icon: "person-add", color: "#3b82f6", label: "User Promoted" };
      default:
        return {
          icon: "information-circle",
          color: "#6b7280",
          label: "Admin Action",
        };
    }
  };

  const renderLogItem = ({ item }: { item: AdminLog }) => {
    const config = getActionConfig(item.action_type);

    return (
      <TouchableOpacity
        style={styles.logCard}
        onPress={() => setSelectedLog(item)}
        activeOpacity={0.7}
      >
        <View style={styles.headerRow}>
          <View
            style={[styles.badge, { backgroundColor: `${config.color}15` }]}
          >
            <Icon
              name={config.icon}
              size={14}
              color={config.color}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>

        <Text style={styles.detailsText} numberOfLines={3}>
          {item.details}
        </Text>

        <View style={styles.adminRow}>
          <Icon name="person-circle-outline" size={16} color="#9ca3af" />
          <Text style={styles.adminName}>
            By:{" "}
            {item.admin_name || item.admin_email?.split("@")[0] || "Unknown"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper to split details into message and reason
  const parseLogDetails = (details: string) => {
    const reasonMarker = "Reason: ";
    const noteMarker = "Note: "; // Fallback for old logs

    let markerIndex = details.indexOf(reasonMarker);
    if (markerIndex === -1) markerIndex = details.indexOf(noteMarker);

    if (markerIndex !== -1) {
      const mainMessage = details.substring(0, markerIndex).trim();
      // Allow for either "Reason: " or "Note: " length
      const markerLength = details.includes(reasonMarker)
        ? reasonMarker.length
        : noteMarker.length;
      const reason = details.substring(markerIndex + markerLength).trim();
      return { mainMessage, reason };
    }

    return { mainMessage: details, reason: null };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
      </View>
    );
  }

  // Parse details for the selected log only when rendering the modal
  const parsedDetails = selectedLog
    ? parseLogDetails(selectedLog.details)
    : { mainMessage: "", reason: null };

  return (
    <SafeAreaView style={styles.container}>
      {/* List */}
      {logs.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title="No Logs Yet"
          message="Admin actions will appear here."
        />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#6366f1"
            />
          }
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={!!selectedLog}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLog(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Details</Text>
              <TouchableOpacity onPress={() => setSelectedLog(null)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Action Type</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: getActionConfig(selectedLog.action_type).color },
                    ]}
                  >
                    {getActionConfig(selectedLog.action_type).label}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Performed By</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.admin_name || "Unknown"}
                  </Text>
                  <Text style={styles.detailSubValue}>
                    {selectedLog.admin_email}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {formatFullDate(selectedLog.created_at)}
                  </Text>
                  <Text style={styles.detailSubValue}>
                    {formatTime(selectedLog.created_at)}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Target ID</Text>
                  <Text style={styles.detailValue} selectable>
                    {selectedLog.target_id || "N/A"}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Summary</Text>
                  <Text style={styles.messageText}>
                    {parsedDetails.mainMessage}
                  </Text>
                </View>

                {parsedDetails.reason && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Reason / Admin Note</Text>
                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonText}>
                        {parsedDetails.reason}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  listContent: { padding: 16 },

  logCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { fontSize: 13, fontWeight: "700" },
  dateText: { fontSize: 12, color: "#9ca3af" },

  detailsText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },

  adminRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  adminName: { fontSize: 13, color: "#6b7280", marginLeft: 6 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "80%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  modalBody: {},
  detailItem: { marginBottom: 20 },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 16, color: "#1f2937", fontWeight: "500" },
  detailSubValue: { fontSize: 14, color: "#9ca3af", marginTop: 2 },

  messageText: { fontSize: 15, color: "#374151", lineHeight: 22 },

  // New styles for the reason box
  reasonBox: {
    backgroundColor: "#fefefeff", // Light red/pink background for emphasis
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7b7a7aff",
    borderLeftWidth: 4,
    borderLeftColor: "#434242ff",
  },
  reasonText: {
    fontSize: 15,
    color: "#030303ff",
    lineHeight: 22,
    fontStyle: "italic",
  },
});

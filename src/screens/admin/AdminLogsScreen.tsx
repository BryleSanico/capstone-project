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
import Icon from "react-native-vector-icons/Ionicons";
import { Loader } from "../../components/LazyLoaders/loader";
import { useAdminLogs } from "../../hooks/";
import {
  formatFullDate,
  formatTime,
} from "../../utils/formatters/dateFormatter";
import { AdminLog } from "../../types/admin";
import { EmptyState } from "../../components/ui/Errors/EmptyState";
import { formatRelativeTime } from "../../utils/formatters/relativeTimeFormatter";
import ScreenHeader from "../../components/ui/ScreenHeader";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import { getActionConfig } from "../../utils/ui/adminLogConfig";
import { Colors } from "../../constants/colors";

type AdminLogsScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function AdminLogsScreen() {
  const navigation = useNavigation<AdminLogsScreenNavigationProp>();
  const { data: logs = [], isLoading, refetch, isRefetching } = useAdminLogs();
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

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

  const renderLogItem = ({ item }: { item: AdminLog }) => {
    const config = getActionConfig(item.action_type);
    const { mainMessage } = parseLogDetails(item.details); // Only show main message in list

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
              style={styles.badgeIcon}
            />
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.title}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>

        <Text style={styles.detailsText} numberOfLines={2}>
          {mainMessage}
        </Text>

        <View style={styles.adminRow}>
          <Icon name="person-circle-outline" size={16} color="#9ca3af" />
          <Text style={styles.adminName}>
            By {item.admin_name || item.admin_email?.split("@")[0] || "Unknown"}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
    <View style={styles.container}>
      <ScreenHeader
        title="Audit Logs"
        subtitle="History of admin actions"
        showBackButton={true}
        onBack={() => navigation.goBack()}
      />
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
                    {getActionConfig(selectedLog.action_type).title}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  listContent: { padding: 16 },

  logCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.gray100,
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
  badgeIcon: { marginRight: 6 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  dateText: { fontSize: 12, color: Colors.gray400 },

  detailsText: {
    fontSize: 15,
    color: Colors.gray700,
    lineHeight: 22,
    marginBottom: 12,
  },

  adminRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  adminName: { fontSize: 13, color: Colors.gray500, marginLeft: 6 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
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
  modalTitle: { fontSize: 20, fontWeight: "bold", color: Colors.gray900 },
  modalBody: {},
  detailItem: { marginBottom: 20 },
  detailLabel: {
    fontSize: 12,
    color: Colors.gray500,
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 16, color: Colors.gray800, fontWeight: "500" },
  detailSubValue: { fontSize: 14, color: Colors.gray400, marginTop: 2 },

  messageText: { fontSize: 15, color: Colors.gray700, lineHeight: 22 },

  reasonBox: {
    backgroundColor: Colors.backgroundCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderLeftWidth: 4,
    borderLeftColor: Colors.borderDarkGray,
  },
  reasonText: {
    fontSize: 15,
    color: Colors.textQuaternary,
    lineHeight: 22,
    fontStyle: "italic",
  },
});

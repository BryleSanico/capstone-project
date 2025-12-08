import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Platform,
} from "react-native";
import { Loader } from "../../components/LazyLoaders/loader";
import ActionableEventCard from "../../components/ui/Cards/ActionableEventCard";
import Icon from "react-native-vector-icons/Ionicons";
import { EmptyState } from "../../components/ui/Errors/EmptyState";
import {
  usePendingEvents,
  useApproveEvent,
  useRejectEvent,
} from "../../hooks/";
import { Event } from "../../types/event";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import TabSelector, { TabItem } from "../../components/navigation/TabSelector";
import ScreenHeader from "../../components/ui/ScreenHeader";
import { Colors } from "../../constants/colors";

type EventApprovalsScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

// Tab Constants
const TAB_NEW = "new";
const TAB_UPDATED = "updated";

export default function EventApprovalsScreen() {
  const navigation = useNavigation<EventApprovalsScreenNavigationProp>();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectType, setRejectType] = useState<"revision" | "delete">(
    "revision"
  ); // Track reject type

  // Tab State
  const [selectedTab, setSelectedTab] = useState<string>(TAB_NEW);

  // Data
  const {
    data: allPendingEvents = [],
    isLoading,
    refetch,
    isRefetching,
  } = usePendingEvents();
  const approveMutation = useApproveEvent();
  const rejectMutation = useRejectEvent();

  // Filter Data based on isUpdate flag
  const { newEvents, updatedEvents } = useMemo(() => {
    const newEvs: Event[] = [];
    const updatedEvs: Event[] = [];
    allPendingEvents.forEach((ev) => {
      if (ev.isUpdate) updatedEvs.push(ev);
      else newEvs.push(ev);
    });
    return { newEvents: newEvs, updatedEvents: updatedEvs };
  }, [allPendingEvents]);

  const currentData = selectedTab === TAB_NEW ? newEvents : updatedEvents;

  const tabs: TabItem[] = [
    { key: TAB_NEW, title: "New Events", count: newEvents.length },
    { key: TAB_UPDATED, title: "Updated Events", count: updatedEvents.length },
  ];

  // Actions
  const handleEventPress = (eventId: number) => {
    navigation.navigate("EventDetails", {
      id: eventId,
      initialIsFavorite: false,
    });
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleRejectPress = (id: number) => {
    setSelectedEventId(id);
    setRejectReason("");
    setRejectType("revision"); // Default to revision
    setRejectModalVisible(true);
  };

  const submitReject = () => {
    if (selectedEventId && rejectReason.trim()) {
      rejectMutation.mutate(
        {
          id: selectedEventId,
          reason: rejectReason,
          hardDelete: rejectType === "delete",
        },
        {
          onSuccess: () => setRejectModalVisible(false),
        }
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
      </View>
    );
  }

  const renderAdminActions = (event: Event) => (
    <View style={styles.actionRow}>
      <TouchableOpacity
        style={[styles.btn, styles.rejectBtn]}
        onPress={() => handleRejectPress(event.id)}
      >
        <Icon name="close-circle" size={18} color={Colors.white} />
        <Text style={styles.btnText}>Reject</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.approveBtn]}
        onPress={() => handleApprove(event.id)}
      >
        <Icon name="checkmark-circle" size={18} color={Colors.white} />
        <Text style={styles.btnText}>Approve</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Pending Approvals"
        subtitle="Review and manage event submissions"
      />
      <TabSelector
        tabs={tabs}
        selectedTabKey={selectedTab}
        onSelectTab={setSelectedTab}
      />

      <View style={styles.content}>
        {currentData.length === 0 ? (
          <EmptyState
            icon={
              selectedTab === TAB_NEW ? "sparkles-outline" : "refresh-outline"
            }
            title="No Pending Events"
            message={
              selectedTab === TAB_NEW
                ? "No new event submissions."
                : "No updated events waiting for review."
            }
          />
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => {
                  refetch();
                }}
                tintColor={Colors.primary}
              />
            }
            contentContainerStyle={styles.flatListContent}
            renderItem={({ item }) => (
              <ActionableEventCard
                event={item}
                onPress={() => handleEventPress(item.id)}
                renderActions={renderAdminActions}
              />
            )}
          />
        )}
      </View>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Event</Text>
            <Text style={styles.modalSubtitle}>
              Select rejection type and provide a reason.
            </Text>

            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  rejectType === "revision" && styles.typeOptionActive,
                ]}
                onPress={() => setRejectType("revision")}
              >
                <Icon
                  name="construct-outline"
                  size={20}
                  color={rejectType === "revision" ? Colors.white : Colors.iconGray}
                />
                <Text
                  style={[
                    styles.typeText,
                    rejectType === "revision" && styles.typeTextActive,
                  ]}
                >
                  Request Revision
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  rejectType === "delete" && styles.typeOptionActiveDelete,
                ]}
                onPress={() => setRejectType("delete")}
              >
                <Icon
                  name="trash-outline"
                  size={20}
                  color={rejectType === "delete" ? Colors.white : Colors.iconGray}
                />
                <Text
                  style={[
                    styles.typeText,
                    rejectType === "delete" && styles.typeTextActive,
                  ]}
                >
                  Delete Event
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              {rejectType === "revision"
                ? "Sends a warning notification. The event remains in the system but hidden from Discover."
                : "Permanently deletes the event and its data. This cannot be undone."}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Reason for rejection..."
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  rejectType === "delete" ? styles.bgDelete : styles.bgRevision,
                ]}
                onPress={submitReject}
              >
                <Text style={styles.modalBtnTextConfirm}>
                  {rejectType === "revision" ? "Send Request" : "Delete Event"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Platform.OS === "ios"
        ? Colors.background
        : Colors.platformBackgroundAndroid,
  },
  content: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  flatListContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },

  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor:
      Platform.OS === "ios" ? Colors.border : Colors.platformBorderAndroid,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  rejectBtn: { backgroundColor: Colors.danger },
  approveBtn: { backgroundColor: Colors.success },
  btnText: {
    color: Colors.white,
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: Colors.gray500, marginBottom: 16 },

  typeSelector: { flexDirection: "row", gap: 10, marginBottom: 12 },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
  },
  typeOptionActive: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  typeOptionActiveDelete: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  typeText: { marginLeft: 8, fontWeight: "600", color: Colors.gray600 },
  typeTextActive: { color: Colors.white },

  helperText: {
    fontSize: 12,
    color: Colors.gray500,
    marginBottom: 12,
    fontStyle: "italic",
  },

  input: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },

  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtnCancel: { padding: 12, marginRight: 8 },
  modalBtnConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  bgRevision: { backgroundColor: Colors.warning },
  bgDelete: { backgroundColor: Colors.danger },
  modalBtnTextCancel: { color: Colors.gray500, fontWeight: "600" },
  modalBtnTextConfirm: { color: Colors.white, fontWeight: "600" },
});

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loader } from "../../components/LazyLoaders/loader";
import EventCard from "../../components/ui/Cards/EventCard";
import Icon from "react-native-vector-icons/Ionicons";
import { EmptyState } from "../../components/ui/Errors/EmptyState";
import {
  usePendingEvents,
  useApproveEvent,
  useRejectEvent,
} from "../../hooks/useAdmin";

export default function EventApprovalsScreen() {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // REACT QUERY DATA FETCHING
  const {
    data: pendingEvents = [],
    isLoading,
    refetch,
    isRefetching,
  } = usePendingEvents();
  const approveMutation = useApproveEvent();
  const rejectMutation = useRejectEvent();

  const handleApprove = (id: number) => {
    Alert.alert("Confirm", "Approve this event to go live?", [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => approveMutation.mutate(id) },
    ]);
  };

  const handleRejectPress = (id: number) => {
    setSelectedEventId(id);
    setRejectModalVisible(true);
  };

  const submitReject = () => {
    if (selectedEventId && rejectReason.trim()) {
      rejectMutation.mutate(
        { id: selectedEventId, reason: rejectReason },
        {
          onSuccess: () => {
            setRejectModalVisible(false);
            setRejectReason("");
            Alert.alert("Rejected", "Event rejected and user notified.");
          },
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Pending Approvals</Text>

      {pendingEvents.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="All Caught Up"
          message="No events waiting for approval."
        />
      ) : (
        <FlatList
          data={pendingEvents}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#6366f1"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.approvalCardWrapper}>
              <View pointerEvents="none">
                <EventCard event={item} onPress={() => {}} />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={() => handleRejectPress(item.id)}
                >
                  <Icon name="close-circle" size={20} color="#fff" />
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => handleApprove(item.id)}
                >
                  <Icon name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Event</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for the organizer.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Invalid location details..."
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
                style={styles.modalBtnConfirm}
                onPress={submitReject}
              >
                <Text style={styles.modalBtnTextConfirm}>Reject Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 20,
    color: "#1f2937",
  },
  approvalCardWrapper: { marginBottom: 24 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: -10, // Tuck under card
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  rejectBtn: { backgroundColor: "#ef4444" },
  approveBtn: { backgroundColor: "#10b981" },
  btnText: { color: "#fff", fontWeight: "600", marginLeft: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtnCancel: { padding: 12, marginRight: 8 },
  modalBtnConfirm: { backgroundColor: "#ef4444", padding: 12, borderRadius: 8 },
  modalBtnTextCancel: { color: "#6b7280", fontWeight: "600" },
  modalBtnTextConfirm: { color: "#fff", fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});

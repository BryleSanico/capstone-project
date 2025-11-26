/**
 * Returns the UI configuration (icon, color, title) for a given admin action type.
 */
export const getActionConfig = (type: string) => {
  switch (type) {
    case "APPROVE_EVENT":
      return {
        icon: "checkmark-circle",
        color: "#10b981",
        title: "Event Approved",
      };
    case "REJECT_DELETE":
      return {
        icon: "trash",
        color: "#ef4444",
        title: "Event Deleted",
      };
    case "REJECT_REVISION":
      return {
        icon: "construct",
        color: "#f59e0b",
        title: "Revision Requested",
      };
    case "PROMOTE_USER":
      return {
        icon: "person-add",
        color: "#3b82f6",
        title: "User Promoted",
      };
    case "BAN_USER":
      return {
        icon: "ban",
        color: "#ef4444",
        title: "User Ban Status",
      };
    default:
      return {
        icon: "information-circle",
        color: "#6b7280",
        title: "Admin Action",
      };
  }
};
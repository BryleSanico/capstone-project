/**
 * Returns the UI configuration (icon, color, title) for a given admin action type.
 */
import { Colors } from "../../constants/colors";

export const getActionConfig = (type: string) => {
  switch (type) {
    case "APPROVE_EVENT":
      return {
        icon: "checkmark-circle",
        color: Colors.success,
        title: "Event Approved",
      };
    case "REJECT_DELETE":
      return {
        icon: "trash",
        color: Colors.danger,
        title: "Event Deleted",
      };
    case "REJECT_REVISION":
      return {
        icon: "construct",
        color: Colors.warning,
        title: "Revision Requested",
      };
    case "PROMOTE_USER":
      return {
        icon: "person-add",
        color: Colors.info,
        title: "User Promoted",
      };
    case "BAN_USER":
      return {
        icon: "ban",
        color: Colors.danger,
        title: "User Ban Status",
      };
    default:
      return {
        icon: "information-circle",
        color: Colors.textMuted,
        title: "Admin Action",
      };
  }
};

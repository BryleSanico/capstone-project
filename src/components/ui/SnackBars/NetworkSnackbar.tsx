import React, { useEffect, useRef, useState } from "react";
import { Snackbar } from "react-native-paper";
import { useNetworkStatus } from "../../../stores/network-store";
import { Colors } from "../../../constants/colors";

/**
 * Determines the snackbar color based on the message.
 * Green for success ("Back online!"), Red for errors.
 */
const getSnackbarColor = (message: string | null): string => {
  if (!message) return Colors.neutral333;

  const lowerCaseMessage = message.toLowerCase();

  // List of error-indicating keywords
  if (
    lowerCaseMessage.includes("offline") ||
    lowerCaseMessage.includes("slow") ||
    lowerCaseMessage.includes("failed") ||
    lowerCaseMessage.includes("wrong")
  ) {
    return Colors.errorDark;
  }

  // Explicitly check for success
  if (
    lowerCaseMessage.includes("online") ||
    lowerCaseMessage.includes("connected")
  ) {
    return Colors.successDark;
  }

  return Colors.neutral333;
};

export const NetworkSnackbar = () => {
  const { message, setMessage } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message && message !== currentMessage) {
      if (visible) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Defer state updates to avoid synchronous setState in effect
        timeoutRef.current = setTimeout(() => {
          setVisible(false);
          // Wait briefly before showing the next snackbar
          setTimeout(() => {
            setCurrentMessage(message);
            setVisible(true);
          }, 300);
        }, 0);
      } else {
        setTimeout(() => {
          setCurrentMessage(message);
          setVisible(true);
        }, 0);
      }
    }
  }, [message, currentMessage, visible]);

  const handleDismiss = () => {
    setVisible(false);
    // Wait for dismiss animation to finish before clearing
    setTimeout(() => {
      // Only clear the message if it's the one we're showing
      if (message === currentMessage) {
        setMessage(null);
      }
    }, 250);
  };

  return (
    <Snackbar
      visible={visible}
      onDismiss={handleDismiss}
      duration={2500}
      style={{
        backgroundColor: getSnackbarColor(currentMessage),
      }}
    >
      {currentMessage}
    </Snackbar>
  );
};

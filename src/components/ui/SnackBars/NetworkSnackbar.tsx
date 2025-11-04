import React, { useEffect, useRef, useState } from "react";
import { Snackbar } from "react-native-paper";
import { useNetworkStatus } from "../../stores/network-store";

/**
 * Determines the snackbar color based on the message.
 * Green for success ("Back online!"), Red for errors.
 */
const getSnackbarColor = (message: string | null): string => {
  if (!message) return "#16a34a"; // Default green
  
  const lowerCaseMessage = message.toLowerCase();
  
  // List of error-indicating keywords
  if (
    lowerCaseMessage.includes("offline") ||
    lowerCaseMessage.includes("slow") ||
    lowerCaseMessage.includes("failed") ||
    lowerCaseMessage.includes("wrong")
  ) {
    return "#b91c1c"; // Red
  }
  
  return "#16a34a"; // Green for "Back online!"
};

export const NetworkSnackbar = () => {
  const { message, setMessage } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message && message !== currentMessage) {
      if (visible) {
        setVisible(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Wait briefly before showing the next snackbar
        timeoutRef.current = setTimeout(() => {
          setCurrentMessage(message);
          setVisible(true);
        }, 300);
      } else {
        setCurrentMessage(message);
        setVisible(true);
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


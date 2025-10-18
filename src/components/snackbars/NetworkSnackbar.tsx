import React, { useEffect, useRef, useState } from "react";
import { Snackbar } from "react-native-paper";
import { useNetworkStatus } from "../../stores/network-store";

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
  }, [message]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setMessage(null), 250);
  };

  return (
    <Snackbar
      visible={visible}
      onDismiss={handleDismiss}
      duration={2500}
      style={{
        backgroundColor: currentMessage?.includes("offline") ? "#b91c1c" : "#16a34a",
      }}
    >
      {currentMessage}
    </Snackbar>
  );
};

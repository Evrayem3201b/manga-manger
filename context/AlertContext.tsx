import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { createContext, useCallback, useContext, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AlertType = "danger" | "info" | "success";

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string | null; // Pass null explicitly to hide cancel even if onConfirm exists
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const showAlert = useCallback(
    (opts: AlertOptions) => {
      setOptions(opts);
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim],
  );

  const hideAlert = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setOptions(null);
    });
  }, [fadeAnim]);

  const handleConfirm = () => {
    if (options?.onConfirm) options.onConfirm();
    hideAlert();
  };

  // Logic to determine if we show the cancel button
  // Show cancel if: it's not explicitly null AND (there's an onConfirm action OR cancelText is provided)
  const showCancel =
    options?.cancelText !== null && (options?.onConfirm || options?.cancelText);

  const getIcon = () => {
    switch (options?.type) {
      case "danger":
        return { name: "alert-circle", color: "#ff4444" };
      case "success":
        return { name: "checkmark-circle", color: "#4BB543" };
      default:
        return { name: "information-circle", color: Colors.dark.primary };
    }
  };

  const iconData = getIcon();

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={hideAlert}
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.alertBox,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={iconData.name as any}
                size={32}
                color={iconData.color}
              />
            </View>

            <Text style={styles.title}>{options?.title}</Text>
            <Text style={styles.message}>{options?.message}</Text>

            <View style={styles.buttonRow}>
              {showCancel && (
                <Pressable style={styles.cancelBtn} onPress={hideAlert}>
                  <Text style={styles.cancelBtnText}>
                    {options?.cancelText || "Cancel"}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.confirmBtn,
                  options?.type === "danger" && styles.confirmBtnDanger,
                  !showCancel && { flex: 0, width: "100%" }, // Make confirm full width if no cancel
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmBtnText}>
                  {options?.confirmText || (showCancel ? "Confirm" : "Okay")}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertBox: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#111",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
  },
  iconContainer: { marginBottom: 15 },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#1a1a1e",
  },
  cancelBtnText: { color: "#666", fontWeight: "700", fontSize: 15 },
  confirmBtn: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: Colors.dark.primary,
  },
  confirmBtnDanger: { backgroundColor: "#ff4444" },
  confirmBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
});

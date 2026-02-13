import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export interface BackToastRef {
  show: () => void;
}

const BackToast = forwardRef<BackToastRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;

  useImperativeHandle(ref, () => ({
    show: () => {
      if (visible) return;
      setVisible(true);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setVisible(false));
      }, 2000);
    },
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.pill}>
        <Ionicons name="exit-outline" size={16} color={Colors.dark.primary} />
        <Text style={styles.text}>Press again to exit</Text>
      </View>
    </Animated.View>
  );
});

// ADD THIS LINE:
BackToast.displayName = "BackToast";

export default BackToast;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#222",
    gap: 10,
    elevation: 10,
  },
  text: { color: "#fff", fontSize: 13, fontWeight: "700" },
});

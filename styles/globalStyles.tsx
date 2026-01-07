import { Colors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  text: {
    color: Colors.dark.text,
  },
  input: {
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderRadius: 8,
    color: Colors.dark.text,
  },
  mutedText: {
    color: Colors.dark.mutedForeground,
  },
  buttonPrimary: {
    color: Colors.dark.text,
    backgroundColor: Colors.dark.primary,
    width: "100%",
    borderRadius: 9,
    paddingInline: 10,
    paddingBlock: 10,
    height: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});

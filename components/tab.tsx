import { Colors } from "@/constants/theme";
import { UserFilter } from "@/utils/types";
import React from "react";
import { TextStyle, ViewStyle } from "react-native";
import { FastTouchableOpacity } from "./FastTouchableOpacity";
import { ThemedText } from "./themed-text";

export default function Tab({
  title,
  isActive,
  onPress,
  badgeColorActive,
  badgeColorInactive,
  badgeTextColorActive,
  badgeTextColorInactive,
  styleBackground,
  styleText,
}: {
  title: string;
  isActive: boolean;
  onPress?: (selectedFilter: UserFilter) => void;
  badgeColorInactive?: string;
  badgeColorActive?: string;
  badgeTextColorActive?: string;
  badgeTextColorInactive?: string;
  styleBackground?: ViewStyle;
  styleText?: TextStyle;
}) {
  const defaultBackgroundStyles: ViewStyle = {
    paddingInline: 15,
    height: 39,
    paddingBlock: 7,
    borderRadius: 1000,
    width: "auto",
  };
  const defaultTextStyles: TextStyle = {
    fontSize: 17,
  };
  return (
    <FastTouchableOpacity
      onPress={() => onPress?.(title as UserFilter)}
      style={[
        isActive
          ? { backgroundColor: badgeColorActive ?? Colors.dark.primaryLighter }
          : {
              backgroundColor:
                badgeColorInactive ?? Colors.dark.translucentForeground,
            },
        styleBackground,
        defaultBackgroundStyles,
      ]}
      animationDuration={100} // Set the animation duration
    >
      <ThemedText
        lightColor={Colors.dark.text}
        style={[
          isActive
            ? {
                color: badgeTextColorActive ?? Colors.dark.background,
              }
            : {
                color: badgeTextColorInactive ?? Colors.dark.text,
              },
          styleText,
          defaultTextStyles,
        ]}
      >
        {title}
      </ThemedText>
    </FastTouchableOpacity>
  );
}

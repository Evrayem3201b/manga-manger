import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { UserFilter } from "./types";

export function getBadgeColor(status: UserFilter) {
  switch (status) {
    case "ongoing":
      const ongoingColor = "#51a2ff";
      return {
        badgeTextColor: ongoingColor,
        badgeBackgroundColor: "rgb(59 130 246 / 0.2)",
        badgeIcon: (
          <MaterialIcons
            name="collections-bookmark"
            size={15}
            color={ongoingColor}
          />
        ),
      };
    case "completed":
      const completedColor = "#00d492";
      return {
        badgeTextColor: completedColor,
        badgeBackgroundColor: "rgb(16 185 129 / 0.2)",
        badgeIcon: (
          <MaterialIcons name="check" size={15} color={completedColor} />
        ),
      };
    case "hiatus":
      const onHoldColor = "#ffb900";
      return {
        badgeTextColor: onHoldColor,
        badgeBackgroundColor: "rgb(245 158 11 / 0.2)",
        badgeIcon: <MaterialIcons name="pause" size={15} color={onHoldColor} />,
      };
    case "cancelled":
      const droppedColor = "#ff6467";
      return {
        badgeTextColor: droppedColor,
        badgeBackgroundColor: "rgb(239 68 68 / 0.2)",
        badgeIcon: (
          <MaterialIcons name="close" size={15} color={droppedColor} />
        ),
      };
    case "plan-to-read":
      const planToReadColor = "#51a2ff";
      return {
        badgeTextColor: planToReadColor,
        badgeBackgroundColor: "rgb(59 130 246 / 0.2)",
        badgeIcon: (
          <MaterialIcons name="bookmark" size={15} color={planToReadColor} />
        ),
      };
    case "favorites":
      const favoritesColor = "#fb64b6";
      return {
        badgeTextColor: favoritesColor,
        badgeBackgroundColor: "rgb(236 72 153 / 0.2)",
        badgeIcon: (
          <MaterialIcons
            name="favorite-outline"
            size={15}
            color={favoritesColor}
          />
        ),
      };
  }
}

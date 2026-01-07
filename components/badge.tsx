import { getBadgeColor as BadgeData } from "@/utils/BadgeData";
import { UserFilter } from "@/utils/types";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "./themed-text";

export default function Badge({
  status,
}: {
  status: { title: string; name: UserFilter } | null;
}) {
  if (!status) return;
  return (
    <>
      <View
        style={{
          position: "absolute",
          zIndex: 9999,
          bottom: 10,
          left: 10,
          backgroundColor: `${BadgeData(status?.name)?.badgeBackgroundColor}`,
          width: "auto",
          borderRadius: 1000,
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
        }}
      >
        <View
          style={{
            paddingBlock: 1,
            paddingInline: 7,
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            flexDirection: "row",
            gap: 2,
          }}
        >
          {BadgeData(status?.name)?.badgeIcon}
          <ThemedText
            style={{
              color: BadgeData(status?.name)?.badgeTextColor,
              fontSize: 12,
              fontFamily: "ls",
              textTransform: "capitalize",
            }}
            lightColor={BadgeData(status?.name)?.badgeTextColor}
          >
            {status?.title}
          </ThemedText>
        </View>
      </View>
    </>
  );
}

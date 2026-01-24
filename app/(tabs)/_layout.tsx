import { Colors } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },

        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",

        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 0,
        },

        tabBarStyle: {
          position: "absolute",
          paddingBottom: 0,
          bottom: /* insets.bottom + 12 */ 12, // 👈 FLOAT ABOVE SYSTEM BAR
          height: 70,
          marginHorizontal: 20,
          borderRadius: 28,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          overflow: "hidden",
        },

        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {/* DARK MATERIAL BASE */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "rgba(10,10,10,0.85)",
                },
              ]}
            />

            {/* CONTROLLED BLUR */}
            <BlurView
              intensity={25}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />

            {/* SOFT EDGE */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                },
              ]}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="library-books" size={24} color={color} />
          ),
          sceneStyle: { backgroundColor: Colors.dark.background },
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          sceneStyle: { backgroundColor: Colors.dark.background },
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="search" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          sceneStyle: { backgroundColor: Colors.dark.background },
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

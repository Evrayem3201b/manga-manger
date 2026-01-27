import { Stack } from "expo-router";
import React from "react";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          // headerShadowVisible: true,
          // headerTitleAlign: "left",
          // headerTitle: ``,

          // headerTitleStyle: {
          //   fontFamily: "poppins",
          // },
          // headerLeft: () => (
          //   <Pressable
          //     style={{
          //       justifyContent: "center",
          //       flexDirection: "row",
          //       alignItems: "center",
          //     }}
          //     onPress={() => router.back()}
          //   >
          //     <Ionicons
          //       name="chevron-back"
          //       size={21}
          //       style={{ paddingRight: 8 }}
          //       color={Colors.dark.text}
          //     />
          //     <Text
          //       style={{
          //         color: Colors.dark.text,
          //         fontSize: 20,
          //         marginTop: 4,
          //         fontFamily: "poppins",
          //       }}
          //     >
          //       Back
          //     </Text>
          //   </Pressable>
          // ),

          // animation: "slide_from_right",
          // headerStyle: {
          //   backgroundColor: Colors.dark.background,
          // },
          // contentStyle: {
          //   backgroundColor: Colors.dark.background,
          // },
        }}
      />
    </Stack>
  );
}

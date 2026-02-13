import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";

export function useDoubleBackExit() {
  const router = useRouter();
  const pathname = usePathname();
  const lastBackPressed = useRef<number>(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      // 1. If we are NOT on a root screen, just go back normally
      if (router.canGoBack()) {
        router.back();
        return true;
      }

      // 2. If we are on a root screen (like Home), handle double tap
      const now = Date.now();
      if (lastBackPressed.current && now - lastBackPressed.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressed.current = now;
      ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => backHandler.remove();
  }, [pathname, router]);
}

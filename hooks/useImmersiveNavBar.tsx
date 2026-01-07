import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";

export function useImmersiveNavBar() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("overlay-swipe");
    // 👆 swipe up temporarily shows it
  }, []);
}

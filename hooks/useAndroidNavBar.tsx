import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";

export function useAndroidNavBar() {
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#000000");
    NavigationBar.setButtonStyleAsync("light");
    NavigationBar.setVisibilityAsync("visible");
  }, []);
}

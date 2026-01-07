import * as Font from "expo-font";
import React from "react";

export default function useCachedResources() {
  const [isLoadingComplete, setIsLoadingComplete] = React.useState(false);
  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await Font.loadAsync({
          lm: require("@/assets/fonts/lm.otf"),
          poppins: require("@/assets/fonts/Poppins-Regular.ttf"),
          ni: require("@/assets/fonts/ni.ttf"),
        });
      } catch (e) {
        alert(e);
      } finally {
        setIsLoadingComplete(true);
      }
    }
    loadResourcesAndDataAsync();
  }, []);
  return isLoadingComplete;
}

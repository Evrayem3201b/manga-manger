import { useFilterStore } from "@/stores/category-store";
import { getStatusFromName } from "@/utils/getStatus";
import { UserFilter } from "@/utils/types";
import React from "react";
import { FlatList, ViewStyle } from "react-native";
import Tab from "./tab";

export default function TabsContainer({
  style,
  data,
}: {
  style?: ViewStyle;
  data: UserFilter[];
}) {
  const filterKeyword = useFilterStore((state) => state.filter);
  const setFilter = useFilterStore((state) => state.handleOnPress);
  const defaultBackgroundStyles: ViewStyle = {
    flexGrow: 0,
  };

  /* useEffect(() => {
    console.log(filterKeyword);
  }, [filterKeyword]);
  useEffect(() => {
    console.log();
  }, []); */

  return (
    <FlatList
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      data={data}
      renderItem={({ item }) => (
        <Tab
          title={getStatusFromName(item)?.title ?? ""}
          isActive={item === filterKeyword}
          onPress={() => {
            setFilter(item);
          }}
        />
      )}
      keyExtractor={(item, index) => `tab-${index}`}
      contentContainerStyle={{
        flexDirection: "row",
        gap: 6,
        // height: 70,
        paddingBottom: 10,
        flexGrow: 0,
      }}
      style={[style, defaultBackgroundStyles]}
    />
  );
}

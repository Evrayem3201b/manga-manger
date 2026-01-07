import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import TabsContainer from "@/components/tab-container";
import { data, filters } from "@/utils/types";
import React, { useState } from "react";

export default function Home() {
  const [searchedTerm, setSearchedTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState(filters);
  const handleFiltering = (filter: string) => {
    setSearchedTerm(filter);
    const filtered = filters.filter((f) => {
      f.title.toLowerCase().includes(filter.toLowerCase());
    });
    setFilteredItems(filtered);
  };

  return (
    <>
      <ScreenHug title="Library" style={{}} count={data.length}>
        <TabsContainer
          data={filters.map((f) => f.name)}
          style={{
            paddingTop: 18,
            // paddingBottom: 90,
            zIndex: 999,
          }}
        />
        <CardContainer mangaSimple={data} />
      </ScreenHug>
    </>
  );
}

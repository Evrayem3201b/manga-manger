import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import TabsContainer from "@/components/tab-container";
import { filters, MangaDB } from "@/utils/types";
import { Octicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  const db = useSQLiteContext();

  const [searchedTerm, setSearchedTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState(filters);
  const [data, setData] = useState<MangaDB[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function fetchManga() {
        // Placeholder for fetching logic
        const fetchedData: MangaDB[] = await db.getAllAsync(
          "SELECT * FROM manga",
        ); // Replace with actual fetch
        setData(fetchedData);
        // console.log(fetchedData);
      }
      fetchManga();
    }, []),
  );

  const handleFiltering = (filter: string) => {
    setSearchedTerm(filter);
    const filtered = filters.filter((f) => {
      f.title.toLowerCase().includes(filter.toLowerCase());
    });
    setFilteredItems(filtered);
  };

  // useEffect(() => {
  //   // Fetch manga data based on searchedTerm or other criteria
  //   async function fetchManga() {
  //     // Placeholder for fetching logic
  //     const fetchedData: (SimpleDisplay & {
  //       description: string;
  //       year: number;
  //       rating: string;
  //     })[] = await db.getAllAsync("SELECT * FROM manga"); // Replace with actual fetch
  //     setData(fetchedData.map((item) => ({
  //       id: item.id,
  //       name: item.name,
  //       totalChap: item.totalChap,
  //       status: item.status,
  //       coverUrl: { uri: item.coverUrl },
  //       currentChap: item.currentChap,
  //       description: item.description,
  //       year: item.year,
  //       rating: item.rating,
  //     })));
  //     // console.log(fetchedData);
  //   }
  //   fetchManga();
  // }, []);
  // useEffect(() => {
  //   const data = async () => {
  //     await db.runAsync(
  //       `INSERT OR IGNORE INTO manga
  //     (id, name, description, cover_url, status, year, rating, created_at, updated_at)
  //    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  //       [
  //         "a1c7c817-4e59-43b7-9365-09675a149a6f", // string (required)
  //         "One Piece", // string
  //         "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Impedit ipsam soluta nulla corporis iure repellendus delectus? Laboriosam consequatur inventore facere!", // null allowed
  //         "",
  //         "completed",
  //         "2010",
  //         "9.4",
  //         Date.now(),
  //         Date.now(),
  //       ]
  //     );
  //     console.log(await db.getAllAsync("SELECT * FROM manga"));
  //   };

  //   data();
  // }, []);

  return (
    <>
      <ScreenHug scroll={false} title="Library" style={{}} count={data?.length}>
        <TabsContainer
          data={filters.map((f) => f.name)}
          style={{
            paddingTop: 18,
            // paddingBottom: 90,
            zIndex: 999,
          }}
        />
        {data.length < 1 ? (
          <View style={styles.emptyState}>
            <Octicons name="issue-tracked-by" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              No manga yet. Add manga to library.
            </Text>
          </View>
        ) : (
          <CardContainer
            mangaSimple={data.map((item) => ({
              id: item.id,
              name: item.name,
              totalChap: item.total_chap,
              status: item.status,
              coverUrl: { uri: item.cover_url },
              currentChap: item.current_chap,
            }))}
          />
        )}
      </ScreenHug>
    </>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    opacity: 0.85,
  },

  emptyText: {
    fontSize: 15,
    color: "#8e8e93",
    textAlign: "center",
    maxWidth: 260,
  },
});

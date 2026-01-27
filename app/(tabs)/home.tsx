import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import TabsContainer from "@/components/tab-container";
import { Colors } from "@/constants/theme";
import { filters, MangaDB } from "@/utils/types";
import { Octicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  const db = useSQLiteContext();

  const [searchedTerm, setSearchedTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState(filters);
  const [data, setData] = useState<MangaDB[]>([]);
  const router = useRouter();

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

  useEffect(() => {
    async function loadUsername() {
      const name: string | null = await db.getFirstAsync(
        `SELECT username FROM "user"`,
      );

      // console.log(name);
      if (!name) {
        router.replace("/");
      }
    }
    loadUsername();
  }, []);

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
              isAdult: item.is_adult === 1 ? true : false,
            }))}
          />
        )}
      </ScreenHug>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 30, // Adjust this based on your bottom tab bar height
    right: 25,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    // Shadow for iOS
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -100, // Centers it visually within the remaining space
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    maxWidth: 200,
    fontFamily: "ls", // Use your custom font if available
  },
});

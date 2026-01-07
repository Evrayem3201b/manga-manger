import React from "react";
import { StyleSheet, View, Text } from "react-native";

const settings = () => {
  return (
    <View>
      <View style={styles.box} />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: "blue",
    width: 100,
    height: 100,
  },
});

export default settings;

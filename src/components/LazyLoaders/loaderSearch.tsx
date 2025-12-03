import React from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

interface LoaderSearchProps {
  size?: number;
}

export const LoaderSearch: React.FC<LoaderSearchProps> = ({ size = 100 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={require("../../../assets/lottie-animations/LoaderSearch.json")}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

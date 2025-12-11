// src/components/TabSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";

export type TabItem = {
  key: string;
  title: string;
  count: number;
};

interface TabSelectorProps {
  tabs: TabItem[];
  selectedTabKey: string;
  onSelectTab: (key: string) => void;
}

export default function TabSelector({
  tabs,
  selectedTabKey,
  onSelectTab,
}: TabSelectorProps) {
  return (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => {
        const isActive = tab.key === selectedTabKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onSelectTab(tab.key)}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.title} ({tab.count})
            </Text>
            {isActive && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    position: "relative" as const,
  },
  activeTab: {},
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.gray500,
  },
  activeTabText: {
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute" as const,
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 3,
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
});

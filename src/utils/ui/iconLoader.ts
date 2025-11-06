import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export type IconLibrary = "Ionicons" | "MaterialIcons" | "FontAwesome";

export const getIconComponent = (library: IconLibrary) => {
  switch (library) {
    case "Ionicons":
      return Ionicons;
    case "MaterialIcons":
      return MaterialIcons;
    case "FontAwesome":
      return FontAwesome;
    default:
      return Ionicons; 
  }
};

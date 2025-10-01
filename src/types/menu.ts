import { IconLibrary } from "../utils/iconLoader";

export type MenuItem = {
  icon: {
    name: string;
    library: IconLibrary;
  };
  title: string;
  subtitle: string;
  onPress: () => void;
};

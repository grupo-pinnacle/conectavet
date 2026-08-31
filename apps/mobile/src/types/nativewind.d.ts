// NativeWind v4 — permite usar `className` en componentes RN de forma tipada.
import "react-native";
import type { TextProps, ViewProps } from "react-native";

declare module "react-native" {
  interface TextProps {
    className?: string;
  }
  interface ViewProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      className?: string;
    }
  }
}
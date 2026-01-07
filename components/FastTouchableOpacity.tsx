import React from "react";
import { Animated, TouchableWithoutFeedback, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  onPress: () => void;
  style: (ViewStyle | undefined)[];
  activeOpacity?: number;
  animationDuration: number;
}

export const FastTouchableOpacity = ({
  children,
  onPress,
  style,
  activeOpacity = 0.05,
  animationDuration = 100,
}: Props) => {
  const opacity = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.timing(opacity, {
      toValue: activeOpacity,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { opacity }]}>{children}</Animated.View>
    </TouchableWithoutFeedback>
  );
};

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ClashFont } from '../constants/fonts';
import { useTheme } from './themes';

interface OutlineButtonProps {
  title: string;
  onPress: () => void;
  testID?: string;
}

// The app's secondary "outline" action: a bordered, unfilled 56pt pill, typically paired with a
// filled Button below it (Payment Found's "View Details", No Payment Found's "Check another TXID").
const OutlineButton: React.FC<OutlineButtonProps> = ({ title, onPress, testID }) => {
  const { colors } = useTheme();

  return (
    <Pressable style={[styles.button, { borderColor: colors.copyButtonBorder }]} onPress={onPress} testID={testID}>
      <Text style={[styles.text, { color: colors.textPrimary }]}>{title}</Text>
    </Pressable>
  );
};

export default OutlineButton;

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: ClashFont.medium,
    fontSize: 16,
  },
});

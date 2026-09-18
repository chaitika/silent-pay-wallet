import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from './themes';

interface HeaderProps {
  leftText: string;
}

export const Header: React.FC<HeaderProps> = ({ leftText }) => {
  const { colors } = useTheme();
  const styleWithProps = StyleSheet.create({
    root: {
      backgroundColor: colors.background,
      borderTopColor: colors.background,
      borderBottomColor: colors.background,
    },
    text: {
      color: colors.foregroundColor,
    },
  });

  return (
    <View style={[styles.root, styleWithProps.root]}>
      <Text style={[styles.text, styleWithProps.text]}>{leftText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  text: {
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 34,
  },
});

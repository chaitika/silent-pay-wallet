import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import SeedWordsGrid from '../../components/SeedWordsGrid';
import InfoBanner from '../../components/InfoBanner';
import ActionButton from '../../components/ActionButton';
import HeaderBackButton from '../../components/HeaderBackButton';
import EyeIcon from '../../components/icons/EyeIcon';
import { useTheme } from '../../components/themes';
import { useStorage } from '../../hooks/context/useStorage';
import { useSettings } from '../../hooks/context/useSettings';
import { useScreenProtect } from '../../hooks/useScreenProtect';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { unlockWithBiometrics, useBiometrics } from '../../hooks/useBiometrics';
import { isE2E } from '../../helpers/e2e';
import { ClashFont } from '../../constants/fonts';
import loc from '../../loc';

type Rect = { top: number; left: number; width: number; height: number };

// Android's blur reads much stronger than iOS per unit (different underlying implementations).
const GRID_BLUR_AMOUNT = Platform.select({ android: 8, default: 20 });

const ViewRecoveryPhrase: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const insets = useSafeAreaInsets();
  const { wallets } = useStorage();
  const { isScreenCaptureAllowed } = useSettings();
  const { isBiometricUseCapableAndEnabled } = useBiometrics();
  const { enableScreenProtect, disableScreenProtect } = useScreenProtect();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // BlurView's Android capture root is the whole Activity content view, not its own bounds
  // (hardcoded natively, not a prop) — rendered as a position-matched sibling overlay to keep the
  // blur visually scoped to the grid. Same capture-root issue means the reveal circle and back
  // button need a genuinely separate native window (Modal, below) — a same-window sibling still
  // gets swept into the blur capture.
  const [gridOverlayLayout, setGridOverlayLayout] = useState<Rect | null>(null);
  const [revealWindowLayout, setRevealWindowLayout] = useState<Rect | null>(null);
  const gridWrapperRef = useRef<View>(null);

  const wallet = wallets[0];
  const words = wallet ? wallet.getSecret().split(' ') : [];

  useFocusEffect(
    useCallback(() => {
      if (isRevealed && !isScreenCaptureAllowed) enableScreenProtect();
      return () => disableScreenProtect();
    }, [isRevealed, disableScreenProtect, enableScreenProtect, isScreenCaptureAllowed]),
  );

  const handleGridLayout = useCallback(() => {
    // measureInWindow gives screen-absolute coordinates. Retried via rAF on failure: the native
    // view can still be mid-creation when this runs, and measureInWindow then calls back with no
    // arguments at all (x/y come back undefined) — keeps retrying until the view actually exists.
    // Self-terminates on unmount, since the ref goes null and further calls become no-ops.
    const measure = () => {
      gridWrapperRef.current?.measureInWindow((x, y, width, height) => {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
          requestAnimationFrame(measure);
          return;
        }
        setRevealWindowLayout({ left: x, top: y, width, height });
        // gridRevealOverlay renders inside the SafeAreaView (not the Modal), so its position is
        // relative to that — which, as a direct unpadded ancestor, starts exactly at the
        // safe-area insets from the true screen origin (no native measurement needed for that).
        setGridOverlayLayout({ left: x - insets.left, top: y - insets.top, width, height });
      });
    };
    requestAnimationFrame(measure);
  }, [insets.left, insets.top]);

  // Modal's Dialog swallows all screen touches while visible (Android default), including the
  // in-page back button — this invisible same-position target restores it, using the header row's
  // own fixed offsets (no ref/measurement needed, since we control that layout directly).
  const backButtonWindowLayout: Rect = { left: insets.left + 12, top: insets.top + 8, width: 40, height: 40 };

  const handleBack = () => navigation.goBack();

  const handleReveal = async () => {
    setIsAuthenticating(true);
    try {
      if (await isBiometricUseCapableAndEnabled()) {
        if (await unlockWithBiometrics()) setIsRevealed(true);
        return;
      }
      setIsRevealed(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const revealContent = revealWindowLayout && (
    <View style={styles.modalRoot} pointerEvents="box-none">
      <TouchableOpacity style={[styles.backButtonGhost, backButtonWindowLayout]} onPress={handleBack} testID="RevealBackButtonGhost" />
      <TouchableOpacity
        style={[styles.revealOverlay, revealWindowLayout]}
        onPress={handleReveal}
        disabled={isAuthenticating}
        accessibilityRole="button"
        accessibilityLabel={loc.settings.security_reveal}
        testID="RevealRecoveryPhraseButton"
      >
        <View style={[styles.revealCircle, { backgroundColor: colors.brandStrong }]}>
          {isAuthenticating ? <ActivityIndicator color={colors.white} /> : <EyeIcon color={colors.white} size={28} />}
        </View>
        <Text style={[styles.revealTitle, { color: colors.textPrimary }]}>{loc.settings.security_recovery_phrase_hidden}</Text>
        <Text style={[styles.revealCaption, { color: colors.textSecondary }]}>{loc.settings.security_recovery_phrase_hidden_subtitle}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <HeaderBackButton onPress={handleBack} color={colors.textPrimary} testID="RecoveryPhraseBackButton" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} testID="ViewRecoveryPhraseScrollView">
        <Text style={[styles.title, { color: colors.textPrimary }]}>{loc.settings.security_recovery_phrase_body_title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {loc.formatString(loc.settings.security_recovery_phrase_body_subtitle, { count: words.length })}
        </Text>

        <InfoBanner
          text={loc.settings.security_recovery_phrase_warning}
          emphasis={loc.settings.security_recovery_phrase_warning_emphasis}
          containerStyle={styles.banner}
        />

        <SeedWordsGrid ref={gridWrapperRef} words={words} revealed={isRevealed} onLayout={handleGridLayout} />
      </ScrollView>

      {/* Positioned/sized in JS to match the grid's on-screen rect — rendered outside the
          ScrollView so BlurView's blur source doesn't tint the rest of the scrollable content. */}
      {!isRevealed && gridOverlayLayout && (
        <View style={[styles.gridRevealOverlay, gridOverlayLayout]} pointerEvents="box-none">
          <BlurView
            style={styles.gridBlur}
            // 'dark' produces a glow/bloom artifact around foreground content that 'light'
            // doesn't — forced regardless of theme; gridScrimBackground below handles the actual
            // light/dark tint instead.
            blurType="light"
            overlayColor="transparent"
            blurAmount={GRID_BLUR_AMOUNT}
            reducedTransparencyFallbackColor={colors.settingsCardBackground}
            autoUpdate={false}
          />
          <View style={[styles.gridScrim, { backgroundColor: colors.gridScrimBackground }]} pointerEvents="none" />
        </View>
      )}

      {!isRevealed &&
        revealContent &&
        (isE2E() ? (
          revealContent
        ) : (
          <Modal transparent animationType="none" onRequestClose={handleBack}>
            {revealContent}
          </Modal>
        ))}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <ActionButton
          title={loc.settings.security_recovery_phrase_done}
          onPress={handleBack}
          backgroundColor={colors.brandPrimary}
          color={colors.white}
          testID="RecoveryPhraseDoneButton"
        />
      </View>
    </SafeAreaView>
  );
};

export default ViewRecoveryPhrase;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: { fontFamily: ClashFont.medium, fontSize: 32, lineHeight: 40, letterSpacing: -1.2, marginBottom: 12 },
  subtitle: { fontFamily: ClashFont.regular, fontSize: 15, lineHeight: 22.5, marginBottom: 20 },
  banner: {
    marginBottom: 20,
  },
  gridRevealOverlay: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
  },
  gridBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalRoot: {
    flex: 1,
  },
  backButtonGhost: {
    position: 'absolute',
  },
  // top/left/width/height come from revealWindowLayout — no static fill here.
  revealOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  revealTitle: { fontFamily: ClashFont.medium, fontSize: 16, marginBottom: 6 },
  revealCaption: { fontFamily: ClashFont.regular, fontSize: 13 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});

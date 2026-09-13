import React, { useCallback, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import SafeArea from '../../components/SafeArea';
import Button from '../../components/Button';
import ClipboardIcon from '../../components/icons/ClipboardIcon';
import InfoBadgeIcon from '../../components/icons/InfoBadgeIcon';
import { useTheme } from '../../components/themes';
import { useStorage } from '../../hooks/context/useStorage';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { DetailViewStackParamList } from '../../navigation/DetailViewStackParamList';
import { HDSilentPaymentsWallet } from '../../class/wallets/hd-bip352-wallet';
import loc from '../../loc';
import presentAlert from '../../components/Alert';
import triggerHapticFeedback, { HapticFeedbackTypes } from '../../modules/hapticFeedback';
import { ClashFont } from '../../constants/fonts';

type TrackPaymentProps = NativeStackScreenProps<DetailViewStackParamList, 'TrackPayment'>;

const TrackPayment: React.FC<TrackPaymentProps> = () => {
  const { wallets } = useStorage();
  const wallet = wallets.length > 0 ? (wallets[0] as HDSilentPaymentsWallet) : null;
  const { navigate } = useExtendedNavigation();
  const { colors } = useTheme();
  const [txid, setTxid] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValidTxid = txid.trim().length === 64 && /^[0-9a-fA-F]+$/.test(txid.trim());
  const isCheckEnabled = isValidTxid && !!wallet;

  const stylesHook = StyleSheet.create({
    inputContainer: {
      borderColor: colors.formBorder,
      backgroundColor: colors.inputBackgroundColor,
    },
    input: {
      color: colors.textPrimary,
    },
    label: {
      color: colors.textPrimary,
    },
    description: {
      color: colors.textSecondary,
    },
    helperText: {
      color: colors.textSecondary,
    },
    pasteButton: {
      backgroundColor: colors.background,
      borderColor: colors.copyButtonBorder,
    },
    infoBox: {
      backgroundColor: colors.surfaceSubtle,
      borderColor: colors.accentSubtle,
    },
    infoTitle: {
      color: colors.textPrimary,
    },
    infoText: {
      color: colors.textSecondary,
    },
  });

  const handlePasteFromClipboard = useCallback(async () => {
    const clipboard = await Clipboard.getString();
    if (clipboard) {
      setTxid(clipboard.trim());
    }
  }, []);

  const handleCheckTransaction = useCallback(async () => {
    if (!wallet) return;

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const result = await wallet.scanByTxid(txid.trim());

      if (result.found) {
        triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
        navigate('PaymentFound', {
          txid: txid.trim(),
          outputs: result.outputs,
          totalValue: result.totalValue,
          confirmations: result.confirmations,
        });
      } else if (result.bothBranchesFailed) {
        triggerHapticFeedback(HapticFeedbackTypes.NotificationWarning);
        presentAlert({ title: loc.errors.network, message: loc.wallet_birth.error_network });
      } else {
        triggerHapticFeedback(HapticFeedbackTypes.NotificationWarning);
        navigate('NoPaymentFound');
      }
    } catch (error: any) {
      // an outage is not a "no payment found" answer - saying so would tell the user their
      // transaction does not exist when we simply could not check.
      console.warn('[SP] Track payment lookup failed:', error?.message ?? error);
      triggerHapticFeedback(HapticFeedbackTypes.NotificationWarning);
      presentAlert({ title: loc.errors.network, message: loc.wallet_birth.error_network });
    } finally {
      setIsLoading(false);
    }
  }, [txid, wallet, navigate]);

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={[styles.description, stylesHook.description]}>{loc.track_payment.description}</Text>

          <View style={styles.field}>
            <Text style={[styles.label, stylesHook.label]}>{loc.track_payment.txid_label}</Text>
            <View style={[styles.inputContainer, stylesHook.inputContainer]}>
              <TextInput
                style={[styles.input, stylesHook.input]}
                placeholder={loc.track_payment.txid_placeholder}
                placeholderTextColor={colors.textSecondary}
                value={txid}
                onChangeText={setTxid}
                autoCapitalize="none"
                autoCorrect={false}
                multiline={false}
                editable={!isLoading}
                testID="TrackPaymentTxidInput"
              />
              <Pressable onPress={handlePasteFromClipboard} style={[styles.pasteButton, stylesHook.pasteButton]} testID="PasteButton">
                <ClipboardIcon size={16} color={colors.brandPrimary} />
              </Pressable>
            </View>
            <Text style={[styles.helperText, stylesHook.helperText]}>{loc.track_payment.txid_helper}</Text>
          </View>

          <View style={[styles.infoBox, stylesHook.infoBox]}>
            <View style={styles.infoHeader}>
              <InfoBadgeIcon size={28} background={colors.accentSubtle} glyphColor={colors.brandPrimary} />
              <Text style={[styles.infoTitle, stylesHook.infoTitle]}>{loc.track_payment.whats_txid}</Text>
            </View>
            <Text style={[styles.infoText, stylesHook.infoText]}>{loc.track_payment.txid_explanation}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loc.track_payment.check_transaction}
            onPress={handleCheckTransaction}
            disabled={!isCheckEnabled || isLoading}
            showActivityIndicator={isLoading}
            testID="CheckTransactionButton"
            backgroundColor={colors.brandPrimary}
            buttonTextColor={colors.white}
            borderRadius={16}
            style={styles.checkButton}
            textStyle={styles.checkButtonText}
          />
        </View>
      </View>
    </SafeArea>
  );
};

export default TrackPayment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    gap: 24,
  },
  description: {
    fontFamily: ClashFont.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: ClashFont.medium,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: ClashFont.regular,
    fontSize: 14,
  },
  pasteButton: {
    width: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontFamily: ClashFont.regular,
    fontSize: 13,
    marginLeft: 4,
  },
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontFamily: ClashFont.medium,
    fontSize: 14,
    flex: 1,
  },
  infoText: {
    fontFamily: ClashFont.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 30,
  },
  checkButton: {
    height: 56,
    minHeight: 56,
    maxHeight: 56,
  },
  checkButtonText: {
    fontFamily: ClashFont.medium,
    fontSize: 16,
  },
});

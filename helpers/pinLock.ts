import { sha256 } from '@noble/hashes/sha256';
import Keychain from 'react-native-keychain';
import { randomBytes } from '../class/rng';

export const PIN_LENGTH = 4;

const KEYCHAIN_SERVICE = 'shroud_pin';

interface StoredPin {
  hash: string;
  salt: string;
}

const hashPin = (pin: string, saltHex: string): string => {
  return Buffer.from(sha256(Buffer.from(`${saltHex}:${pin}`, 'utf8'))).toString('hex');
};

export const hasPinSet = async (): Promise<boolean> => {
  const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  return credentials !== false;
};

export const setPin = async (pin: string): Promise<void> => {
  const salt = (await randomBytes(16)).toString('hex');
  const stored: StoredPin = { hash: hashPin(pin, salt), salt };
  await Keychain.setGenericPassword(KEYCHAIN_SERVICE, JSON.stringify(stored), { service: KEYCHAIN_SERVICE });
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  if (!credentials) return false;
  try {
    const stored: StoredPin = JSON.parse(credentials.password);
    return hashPin(pin, stored.salt) === stored.hash;
  } catch {
    return false;
  }
};

export const clearPin = async (): Promise<void> => {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
};

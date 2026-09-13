import Keychain from 'react-native-keychain';
import { clearPin, hasPinSet, setPin, verifyPin } from '../../helpers/pinLock';

describe('pinLock', () => {
  let store: string | undefined;

  beforeEach(() => {
    store = undefined;
    (Keychain.setGenericPassword as jest.Mock).mockImplementation(async (_username: string, password: string) => {
      store = password;
      return { service: 'shroud_pin', storage: 'mock' };
    });
    (Keychain.getGenericPassword as jest.Mock).mockImplementation(async () => {
      if (store === undefined) return false;
      return { username: 'shroud_pin', password: store, service: 'shroud_pin', storage: 'mock' };
    });
    (Keychain.resetGenericPassword as jest.Mock).mockImplementation(async () => {
      store = undefined;
      return true;
    });
  });

  it('reports no PIN set initially', async () => {
    expect(await hasPinSet()).toBe(false);
  });

  it('sets and verifies a correct PIN', async () => {
    await setPin('1234');
    expect(await hasPinSet()).toBe(true);
    expect(await verifyPin('1234')).toBe(true);
  });

  it('rejects an incorrect PIN', async () => {
    await setPin('1234');
    expect(await verifyPin('0000')).toBe(false);
  });

  it('never stores the PIN in plaintext', async () => {
    await setPin('1234');
    expect(store).toBeDefined();
    expect(store).not.toContain('1234');
  });

  it('clears a set PIN', async () => {
    await setPin('1234');
    await clearPin();
    expect(await hasPinSet()).toBe(false);
    expect(await verifyPin('1234')).toBe(false);
  });
});

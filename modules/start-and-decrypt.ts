import { ShroudApp } from '../class/';

const shroudApp = ShroudApp.getInstance();

export const startAndDecrypt = async (): Promise<boolean> => {
  console.log('startAndDecrypt');
  if (shroudApp.getWallets().length > 0) {
    console.log('App already has some wallets, so we are in already started state, exiting startAndDecrypt');
    return true;
  }
  await shroudApp.migrateKeys();

  try {
    await shroudApp.loadFromDisk();
  } catch (error) {
    // in case of exception reading from keystore, lets retry instead of assuming there is no storage and
    // proceeding with no wallets
    console.warn('exception loading from disk:', error);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // sleep
      await shroudApp.loadFromDisk();
    } catch (error2) {
      console.warn('second exception loading from disk:', error2);
    }
  }

  // Return true regardless: `loadFromDisk` returning false just means there was no wallet data
  // in storage yet, which is a normal state to proceed from (not a failure to unblock on).
  return true;
};

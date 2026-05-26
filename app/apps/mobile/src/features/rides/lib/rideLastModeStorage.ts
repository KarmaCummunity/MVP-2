import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RideMode } from '@kc/domain';

const KEY = 'rides.lastMode';

export type RideLastMode = RideMode;

export async function getRideLastMode(): Promise<RideLastMode> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw === 'request' ? 'request' : 'offer';
}

export async function setRideLastMode(mode: RideLastMode): Promise<void> {
  await AsyncStorage.setItem(KEY, mode);
}

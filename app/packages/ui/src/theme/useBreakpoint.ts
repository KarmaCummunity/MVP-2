import { useWindowDimensions } from 'react-native';
import { resolveBreakpoint, type BreakpointToken } from './breakpoints';

export function useBreakpoint(): BreakpointToken {
  const { width } = useWindowDimensions();
  return resolveBreakpoint(width);
}

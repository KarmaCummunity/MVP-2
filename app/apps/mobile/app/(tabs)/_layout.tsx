// (tabs) is a route group whose tab bar is rendered globally at the root layout
// via <TabBar /> — so this file is just a passthrough Slot. Lifting the tab bar
// to root is what makes it persist on detail screens (chat/[id], post/[id],
// user/[handle], settings) without flicker when crossing tab → detail.
// Mapped to: SRS §6.1 (3-tab bottom nav, RTL).
import { Slot } from 'expo-router';
export default function TabsLayout() {
  return <Slot />;
}

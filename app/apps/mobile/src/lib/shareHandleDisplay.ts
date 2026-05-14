/**
 * Auto-generated profile share handles use the `u_<hex>` shape. These are
 * routing/deep-link identifiers, not human-chosen @mentions — hide them in UI.
 */
export function isOpaqueSystemShareHandle(handle: string): boolean {
  return /^u_[a-f0-9]+$/i.test(handle.trim());
}

import net from 'node:net';

function isProxyAddress(value: string): boolean {
  const parts = value.split('/');
  if (parts.length > 2) return false;
  const [address, prefix] = parts;
  const addressType = net.isIP(address);
  if (!prefix) return addressType > 0;
  const prefixLength = Number(prefix);
  const maxPrefixLength = addressType === 4 ? 32 : addressType === 6 ? 128 : -1;
  return addressType > 0 && /^\d+$/.test(prefix) && prefixLength <= maxPrefixLength;
}

export function parseTrustProxy(value: string | undefined): boolean | string | string[] {
  const normalized = value?.trim();
  if (!normalized) return false;
  if (normalized.toLowerCase() === 'true') return true;
  if (normalized.toLowerCase() === 'false') return false;

  const addresses = normalized.split(',').map((entry) => entry.trim()).filter(Boolean);
  if (addresses.length === 0 || addresses.some((address) => !isProxyAddress(address))) {
    throw new Error('TRUST_PROXY must be true, false, or a comma-separated list of IP addresses/CIDR ranges.');
  }
  return addresses.length === 1 ? addresses[0] : addresses;
}
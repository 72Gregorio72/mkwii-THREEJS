import * as os from 'os';


// helper function to find the ip of the local machine dynamically
export function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // Skip internal (localhost) and non-IPv4 addresses
      if ('IPv4' !== iface.family || iface.internal) {
        continue;
      }
      return iface.address;
    }
  }
  return '127.0.0.1'; // Fallback if no LAN IP is found
}
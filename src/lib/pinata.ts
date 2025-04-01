import axios from 'axios';
import FormData from 'form-data';
import { toast } from 'react-hot-toast';

// List of public IPFS gateways for better availability
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

// Define an interface for the file info structure
interface PinataFileInfo {
  cid: string;
  name: string;
  size: number;
  timestamp: number;
}

/**
 * IPFS/Pinata integration functions
 */

// Convert CID to Pinata gateway URL
export function getPinataUrl(hash: string) {
  try {
    // For debugging purposes - log the CID we're trying to access
    console.log(`Getting URL for CID: ${hash}`);
    
    // Validate the hash is not empty or undefined
    if (!hash || typeof hash !== 'string' || hash.length < 10) {
      console.error('Invalid CID format or empty CID:', hash);
      // Return a fallback file that we know exists
      return 'https://ipfs.io/ipfs/QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx';
    }
    
    // Check localStorage for cached file info
    const filesInfo: PinataFileInfo[] = JSON.parse(localStorage.getItem('pinata_files') || '[]');
    const fileInfo = filesInfo.find(f => f.cid === hash);
    
    if (fileInfo) {
      console.log('Found file info in local cache:', fileInfo);
    }
    
    // Use the Cloudflare IPFS gateway which is often more reliable
    return `${IPFS_GATEWAYS[2]}${hash}`;
  } catch (error) {
    console.error('Error getting Pinata URL:', error);
    return 'https://ipfs.io/ipfs/QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx';
  }
}

// Upload file to IPFS via Pinata
export const uploadToPinata = async (file: File): Promise<string> => {
  // Get Pinata keys from localStorage
  const apiKey = localStorage.getItem('pinata_api_key');
  const secretKey = localStorage.getItem('pinata_secret_key');
  
  if (!apiKey || !secretKey) {
    throw new Error('Pinata API keys not configured');
  }
  
  console.log('Uploading to Pinata with API key:', apiKey.substring(0, 5) + '...');
  
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  
  // Upload to Pinata
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': secretKey
    },
    body: formData as unknown as BodyInit
  });
  
  if (!response.ok) {
    console.error('Pinata error:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('Error details:', errorText);
    throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.IpfsHash;
};

// Check if Pinata is configured
export const isPinataConfigured = (): boolean => {
  const apiKey = localStorage.getItem('pinata_api_key');
  const secretKey = localStorage.getItem('pinata_secret_key');
  return !!(apiKey && secretKey);
};

// Test Pinata API connection
export const testPinataConnection = async (): Promise<boolean> => {
  const apiKey = localStorage.getItem('pinata_api_key');
  const secretKey = localStorage.getItem('pinata_secret_key');
  
  if (!apiKey || !secretKey) {
    return false;
  }
  
  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
};

// Function to get URL from multiple gateways (used in case one fails)
export function getIpfsUrls(hash: string) {
  if (!hash || typeof hash !== 'string' || hash.length < 10) {
    return [IPFS_GATEWAYS[0] + 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx']; // Error page
  }
  
  // Return URLs from all gateways
  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
}

export const getPinataDownloadUrl = (cid: string) => {
  // Use gateway.pinata.cloud which has better download support
  return `https://gateway.pinata.cloud/ipfs/${cid}?download=true`;
};
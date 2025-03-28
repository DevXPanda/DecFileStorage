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

export async function uploadToPinata(file: File) {
  try {
    const apiKey = localStorage.getItem('pinata_api_key');
    const secretKey = localStorage.getItem('pinata_secret_key');

    if (!apiKey || !secretKey) {
      toast.error('Pinata keys not configured. Please configure valid Pinata keys.');
      throw new Error('Pinata keys not configured');
    }

    console.log(`Starting upload of ${file.name} (${file.size} bytes)`);
    toast.loading(`Uploading ${file.name}...`);
    
    // Create metadata for the upload - Pinata will index this metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        size: file.size,
        type: file.type,
        timestamp: Date.now()
      }
    });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', metadata);
    
    // Add options for pinning - IMPORTANT: CIDv1 is more reliable with gateways
    const options = JSON.stringify({
      cidVersion: 1, // Using CIDv1 for better reliability
      wrapWithDirectory: false // Don't wrap in directory for direct access
    });
    formData.append('pinataOptions', options);

    console.log(`Uploading file to Pinata: ${file.name}`);
    
    // Log the API key prefix for debugging (never log full keys)
    console.log(`Using Pinata API key: ${apiKey.substring(0, 4)}...`);
    
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': `multipart/form-data;`,
        pinata_api_key: apiKey,
        pinata_secret_api_key: secretKey,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000 // 2 minute timeout for larger files
    });

    toast.dismiss();
    console.log('Pinata upload successful, response:', response.data);
    
    if (!response.data || !response.data.IpfsHash) {
      throw new Error('Invalid response from Pinata');
    }

    const cid = response.data.IpfsHash;
    console.log(`File uploaded successfully with CID: ${cid}`);
    
    // Verify the uploaded file is accessible
    const verifyUrl = `https://ipfs.io/ipfs/${cid}`;
    console.log(`Verifying file accessibility at: ${verifyUrl}`);
    
    try {
      // Make a HEAD request to check if the file is accessible
      await axios.head(verifyUrl, { timeout: 5000 });
      console.log('File verified accessible on IPFS!');
    } catch (verifyError) {
      console.warn('File might not be immediately available, but upload completed:', verifyError);
    }

    // Store the uploaded file info in localStorage for better retrieval later
    const filesInfo: PinataFileInfo[] = JSON.parse(localStorage.getItem('pinata_files') || '[]');
    filesInfo.push({
      cid: cid,
      name: file.name,
      size: file.size,
      timestamp: Date.now()
    });
    localStorage.setItem('pinata_files', JSON.stringify(filesInfo));

    return cid;
  } catch (error) {
    toast.dismiss();
    console.error('Pinata upload error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      // Handle specific API errors
      if (error.response.status === 401) {
        toast.error('Invalid Pinata API keys. Please check your credentials.');
      } else {
        toast.error(`Upload failed: ${error.response.data?.error || 'Unknown error'}`);
      }
    } else {
      toast.error('Failed to upload to IPFS. Please try again.');
    }
    
    throw error;
  }
}

export function getPinataUrl(hash: string) {
  try {
    // For debugging purposes - log the CID we're trying to access
    console.log(`Getting URL for CID: ${hash}`);
    
    // Validate the hash is not empty or undefined
    if (!hash || typeof hash !== 'string' || hash.length < 10) {
      console.error('Invalid CID format or empty CID:', hash);
      toast.error('Invalid file identifier');
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

// Function to get URL from multiple gateways (used in case one fails)
export function getIpfsUrls(hash: string) {
  if (!hash || typeof hash !== 'string' || hash.length < 10) {
    return [IPFS_GATEWAYS[0] + 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx']; // Error page
  }
  
  // Return URLs from all gateways
  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
}
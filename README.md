Decentralized File Storage
A secure and decentralized file storage system using blockchain and IPFS for immutable and censorship-resistant data storage.

🚀 Features
📂 File Upload & Retrieval: Store files securely on a decentralized network.

🔐 Blockchain Security: Ensures integrity and transparency.

🏦 Supabase Integration: Manage user authentication and file metadata.

📡 IPFS & Pinata: Store and retrieve files with a distributed network.

📤 File Sharing: Generate shareable links with controlled access.

💳 Wallet Integration: Connect MetaMask or other crypto wallets.

⚡ Tech Stack
Frontend: React (Vite.js), TypeScript, Tailwind CSS

Backend: Node.js (Express.js), Supabase

Storage: IPFS (via Pinata), Blockchain

Authentication: Supabase Auth, Web3 Wallets

🎯 Installation & Setup
1️⃣ Clone the Repository
sh
Copy
Edit
git clone https://github.com/DevXPanda/DCFIleStorage.git
cd DCFileStorage
2️⃣ Install Dependencies
sh
Copy
Edit
npm install
3️⃣ Set Up Environment Variables
Create a .env file in the root directory and add the following:

ini
Copy
Edit
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
(Make sure .env is included in .gitignore to protect sensitive data.)

4️⃣ Start the Development Server
sh
Copy
Edit
npm run dev
Open http://localhost:5173 in your browser. 🚀

🛠 Project Structure
php
Copy
Edit
DCFileStorage/
│── src/
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions & API integrations
│   ├── main.tsx          # Entry point for the app
│── supabase/             # Supabase database migrations
│── public/               # Static assets
│── .gitignore            # Ignored files
│── tailwind.config.js    # TailwindCSS configuration
│── vite.config.ts        # Vite configuration
│── README.md             # Project documentation
📜 Usage
Upload Files – Choose files and upload them securely.

Generate Links – Get a decentralized link for sharing.

Access Files – Retrieve files anytime, anywhere.

🚀 Connect with Me
👤 DevXPanda
📧 Email: Satyamkumarpandey4567@gmail.com
🌐 GitHub: DevXPanda

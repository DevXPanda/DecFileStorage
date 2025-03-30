# DCFileStorage - Decentralized File Storage System

A modern, secure decentralized file storage system built with React, allowing users to store and share files using blockchain technology and IPFS.

## 🚀 Features

- 📂 **Secure File Storage**: Store files securely on IPFS
- 🔐 **Authentication**: Email and social login via Clerk
- 🌐 **File Sharing**: Generate secure shareable links
- 💫 **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- 🔒 **Blockchain Integration**: Decentralized storage using IPFS

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Storage**: IPFS via Pinata
- **State Management**: React Hooks
- **UI Components**: Custom components with Tailwind

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/DCFileStorage.git
cd DCFileStorage
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your API keys:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

4. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

- **Clerk**: Set up your Clerk application and add the publishable key to `.env`
- **Supabase**: Configure your Supabase instance and add credentials to `.env`
- **IPFS/Pinata**: Set up your Pinata account for IPFS storage

## 🌟 Usage

1. Sign in using email or social providers
2. Upload files using the drag-and-drop interface
3. View your uploaded files in the dashboard
4. Generate shareable links for your files
5. Manage file access and permissions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- [Clerk](https://clerk.dev/) for authentication
- [IPFS](https://ipfs.io/) for decentralized storage
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for the build tool

# 🩺 MediChain

**MediChain** is a modern, secure, and user-friendly decentralized application (dApp) for managing electronic health records (EHR) on the Solana blockchain. Patients have full control over their medical data, can share it securely with healthcare providers, and monitor all access—empowering privacy and transparency in healthcare.

---

## 🚀 Features

- **Patient-Controlled Access:** Patients decide who can view their records, approve or deny requests, and revoke access at any time.
- **Doctor & Patient Dashboards:** Intuitive, role-based dashboards for managing records, access requests, and sharing.
- **Blockchain Security:** All records are encrypted and access is logged on the Solana blockchain for transparency and immutability.
- **Modern UI/UX:** Responsive, accessible, and visually appealing interface with a vertical roadmap and animated hero section.
- **Wallet Integration:** Seamless Solana wallet connection and authentication.
- **Scalable Architecture:** Modular codebase with clear separation of features, hooks, types, and API logic.
- **Vercel-Ready:** Optimized for instant deployment on Vercel with environment variable support.

---

## 🖼️ How MediChain Works

1. **Create Account:** Connect your Solana wallet to get started.
2. **Upload Records:** Securely upload and encrypt your medical records.
3. **Request Access:** Doctors request access; patients approve or deny.
4. **Control & Monitor:** Patients can revoke access and monitor all activity.
5. **Share Securely:** Share records instantly with trusted providers.

---

## 🏗️ Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Framer Motion
- **Blockchain:** Solana, Solana Wallet Adapter
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL (or your DB)
- **Storage:** NFT.Storage, Web3.Storage (for encrypted files)
- **UI:** Lucide Icons, custom components
- **Deployment:** Vercel

---

## 🛠️ Project Structure

```
src/
  features/         # Core app features (records, access, auth)
  hooks/            # Custom React hooks
  lib/              # Utility functions and API logic
  types/            # TypeScript types and interfaces
  components/       # Reusable UI components
  pages/            # Next.js pages and API routes
  styles/           # Tailwind and global styles
prisma/             # Prisma schema and migrations
public/             # Static assets
```

---

## ⚡ Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/shridmishra/medichain.git
   cd medichain
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**

   In the Vercel dashboard or a `.env.local` file:
   ```
   DATABASE_URL=your_database_url
   NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) to view the app.**

---

## 🌐 Deployment

Deploy instantly on [Vercel](https://vercel.com/):

- Connect your GitHub repo
- Set environment variables (`DATABASE_URL`, `NEXT_PUBLIC_RPC_ENDPOINT`)
- Click **Deploy**

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome! Please open an issue or submit a pull request.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Solana](https://solana.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

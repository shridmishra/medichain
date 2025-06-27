import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Header() {
  return (
    <header className="bg-blue-600 text-white px-6 py-5 flex justify-between items-center shadow-md">
      <h1 className="text-2xl font-bold">MediChain</h1>
      <WalletMultiButton style={{ backgroundColor: '#1D4ED8', /* A darker shade of blue for contrast */ color: 'white', borderRadius: '6px', fontWeight: '600' }} />
    </header>
  );
}
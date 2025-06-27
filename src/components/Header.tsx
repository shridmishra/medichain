import { useRouter } from 'next/router';
import { Activity, Lock, LogOut } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useRef } from 'react';

// Dynamically import WalletModalButton with SSR disabled
const WalletModalButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletModalButton),
  { ssr: false }
);

export default function Header() {
  const router = useRouter();
  const { connected, disconnect, publicKey } = useWallet();
  const prevKey = useRef<string | null>(null);

  // Detect account change and redirect
  useEffect(() => {
    if (prevKey.current && publicKey && prevKey.current !== publicKey.toBase58()) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: publicKey.toBase58() }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            router.push(data.user.role === 'PATIENT' ? '/patient' : '/doctor');
          } else {
            router.push('/');
          }
        });
    }
    prevKey.current = publicKey ? publicKey.toBase58() : null;
  }, [publicKey, router]);

  return (
    <header className="relative z-10 py-4 px-6 md:px-12 flex justify-between items-center bg-dark-bg/60 backdrop-blur-lg border-b border-slate-700/70 shrink-0">
      <button 
        onClick={() => router.push('/')}
        className="flex items-center gap-3 group"
      >
        <Activity className="text-emerald-400 group-hover:text-emerald-300 transition-colors" size={28} />
        <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all">
          MediChain
        </h2>
      </button>
      <div>
        {connected ? (
          <button
            onClick={disconnect}
            className="!bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold !py-2 !px-4 rounded-lg hover:!shadow-xl transition duration-300 flex items-center gap-2"
          >
            Disconnect Wallet
            <LogOut className="ml-2" size={18} />
          </button>
        ) : (
          <WalletModalButton className="!bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold !py-2 !px-4 rounded-lg hover:!shadow-xl transition duration-300 flex items-center gap-2">
            Select Wallet
            <Lock className="ml-2" size={18} />
          </WalletModalButton>
        )}
      </div>
    </header>
  );
} 
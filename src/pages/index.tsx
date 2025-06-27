import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, useInView, useAnimation } from 'framer-motion';
import { FileText, Lock, Share2, Shield, Activity, ExternalLink, UserCircle, BriefcaseMedical } from 'lucide-react';
import { Sora } from 'next/font/google';
import Header from '../components/Header';

// Configure Sora font
const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

// Define TypeScript interfaces
interface Toast {
  message: string;
  type: 'error' | 'success';
}

interface AnimatedStepProps {
  index: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeatureItem {
  icon: React.ReactNode;
  text: string;
}

interface RoadmapStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface RoleSelectionModalProps {
  isOpen: boolean;
  publicKey: string;
  onRoleSelected: (role: 'PATIENT' | 'DOCTOR') => void;
}

// Dynamically import WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const RoleSelectionModal = dynamic<RoleSelectionModalProps>(
  () => import('../../components/RoleSelectionModal'),
  { ssr: false }
);

// Animation component for roadmap steps
const AnimatedStep = ({ index, icon, title, description }: AnimatedStepProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const controls = useAnimation();
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const isOdd = index % 2 !== 0;
  const stepColor = isOdd ? "cyan" : "emerald";
  
  const variants = {
    hidden: { 
      opacity: 0, 
      x: isOdd ? 50 : -50,
      y: 20
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: index * 0.15
      }
    }
  };

  return (
    <motion.div 
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={`relative flex flex-col items-center lg:items-${isOdd ? 'end' : 'start'} z-10 bg-dark-card/40 
        backdrop-blur-sm p-6 rounded-xl border border-slate-800 shadow-lg hover:shadow-${stepColor}-500/10 
        transition-all duration-300 max-w-sm w-full mx-auto lg:mx-0 
        ${isOdd ? 'lg:ml-auto' : 'lg:mr-auto'}`}
    >
      {/* Connect to the central line for desktop */}
      <div className={`absolute hidden lg:block ${isOdd ? 'right-full' : 'left-full'} top-1/2 transform -translate-y-1/2 h-px w-12 
        bg-gradient-to-${isOdd ? 'l' : 'r'} from-${stepColor}-400/50 to-transparent`}></div>
      
      <motion.div 
        className={`bg-${stepColor}-500/20 p-5 rounded-full mb-4 border-2 border-${stepColor}-400 relative`}
        whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <motion.div 
        className="flex items-center mb-3"
        whileHover={{ scale: 1.05 }}
      >
        <span className={`text-${stepColor}-400 font-bold text-2xl mr-2`}>{index + 1}</span>
        <h3 className="text-xl font-semibold">{title}</h3>
      </motion.div>
      <motion.p 
        className="text-medium-text text-base text-center lg:text-left mb-2"
        whileHover={{ color: "#fff" }}
      >
        {description}
      </motion.p>
      
      {/* Connection to the next step (visible on mobile only) */}
      <div className="absolute lg:hidden left-1/2 transform -translate-x-1/2 h-10 w-px bg-gradient-to-b from-transparent to-slate-700/50 -bottom-10"></div>
    </motion.div>
  );
};

export default function Home() {
  const { publicKey, connect, connected } = useWallet();
  const [loading, setLoading] = useState<boolean>(false);
  const [needsRole, setNeedsRole] = useState<boolean>(false);
  const router = useRouter();
  const [toast, setToast] = useState<Toast | null>(null);
  const roadmapRef = useRef<HTMLElement>(null);
  const roadmapInView = useInView(roadmapRef, { once: false, amount: 0.2 });
  const roadmapControls = useAnimation();
  
  useEffect(() => {
    if (roadmapInView) {
      roadmapControls.start("visible");
    }
  }, [roadmapInView, roadmapControls]);

  useEffect(() => {
    if (connected && publicKey) {
      setLoading(true);
      fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicKey: publicKey.toBase58() }) })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            if (data.needsRole) setNeedsRole(true);
            else router.push(data.user.role === 'PATIENT' ? '/patient' : '/doctor');
          } else {
            setToast({ message: 'No user found in response from server.', type: 'error' });
            console.error('No user in response');
          }
        })
        .catch((error) => {
          setToast({ message: 'Failed to connect to backend. Please try again later.', type: 'error' });
          console.error('Fetch error:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [publicKey, connected, connect, router]);

  const handleRoleSelected = (role: 'PATIENT' | 'DOCTOR') => {
    setNeedsRole(false);
    router.push(role === 'PATIENT' ? '/patient' : '/doctor');
  };

  const fadeIn = { 
    hidden: { opacity: 0, y: 20 }, 
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: "easeOut" } 
    } 
  };
  
  const staggerChildren = { 
    hidden: { opacity: 0 }, 
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15 } 
    } 
  };
  
  const floatAnimation = { 
    initial: { y: 0 }, 
    animate: { 
      y: [-10, 10, -10], 
      transition: { repeat: Infinity, duration: 8, ease: "easeInOut" } 
    } 
  };
  
  const pulseAnimation = { 
    initial: { scale: 1 }, 
    animate: { 
      scale: [1, 1.03, 1], 
      transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" } 
    } 
  };

  const featureItems: FeatureItem[] = [
    { icon: <FileText className="text-emerald-400 shrink-0" size={24} />, text: "Patient-Controlled Access" },
    { icon: <Share2 className="text-emerald-400 shrink-0" size={24} />, text: "Easy Sharing with Doctors" },
    { icon: <Lock className="text-emerald-400 shrink-0 " size={24} />, text: "Seamless Usage" },
    { icon: <Shield className="text-emerald-400 shrink-0" size={24} />, text: "Blockchain Security" }
  ];

  const roadmapSteps: RoadmapStep[] = [
    {
      icon: <FileText className="text-emerald-400" size={36} />,
      title: "Create Account",
      description: "Sign up and connect your wallet seamlessly to get started with MediChain."
    },
    {
      icon: <Lock className="text-cyan-400" size={36} />,
      title: "Upload Records",
      description: "Securely upload your medical records. Files are encrypted and stored on the blockchain."
    },
    {
      icon: <Share2 className="text-emerald-400" size={36} />,
      title: "Request Access",
      description: "Doctors request access to specific records. You review and approve or deny each request."
    },
    {
      icon: <Shield className="text-cyan-400" size={36} />,
      title: "Control & Monitor",
      description: "See who has access, revoke it anytime, and monitor all activity for complete transparency."
    },
    {
      icon: <BriefcaseMedical className="text-emerald-400" size={36} />,
      title: "Share Securely",
      description: "Doctors access your records only with your permission. All access is logged for your peace of mind."
    }
  ];

  return (
    <div className={`${sora.className} min-h-screen bg-dark-bg text-light-text flex flex-col relative`}>
      <Head>
        <title>MediChain - Secure EHR on Blockchain</title>
        <meta name="description" content="Empowering patients with control over their health records using Solana blockchain technology." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Enhanced gradient background */}
      <div className="absolute inset-0 min-h-full w-full -z-10 overflow-hidden">
        <motion.div 
          className="absolute top-10 left-5 w-72 h-72 rounded-full bg-theme-blue/20 blur-3xl opacity-60" 
          animate={{ x: [0, 40, 0], y: [0, -20, 0]}} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }} 
        />
        <motion.div 
          className="absolute bottom-10 right-5 w-96 h-96 rounded-full bg-theme-green/20 blur-3xl opacity-50" 
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }} 
        />
        <motion.div 
          className="absolute top-1/3 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl opacity-70" 
          animate={{ scale: [1, 1.15, 1] }} 
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }} 
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-3xl opacity-40" 
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }} 
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }} 
        />
      </div>

      <Header />

      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-around px-4 sm:px-6 md:px-8 py-4 md:py-8 max-w-screen-xl mx-auto flex-grow gap-8 lg:gap-12 w-full">
        <motion.div 
          className="flex-1 w-full lg:max-w-xl mb-6 lg:mb-0 text-center lg:text-left" 
          initial="hidden" 
          animate="visible" 
          variants={staggerChildren}
        >
          <motion.div variants={fadeIn}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Secure Healthcare Records</span>
              <span className="block mt-2 sm:mt-3">on the Blockchain</span>
            </h1>
          </motion.div>
          <motion.p 
            className="text-base sm:text-lg text-medium-text/80 mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0" 
            variants={fadeIn}
          >
            Take control of your medical records and share them securely with healthcare providers using cutting-edge blockchain technology.
          </motion.p>
          <motion.div 
            className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10" 
            variants={staggerChildren}
          >
            {featureItems.map((item, index) => (
              <motion.div 
                key={index} 
                variants={fadeIn} 
                whileHover={{ scale: 1.03, borderColor: 'rgb(16, 185, 129, 0.5)' }}
                className="flex items-center p-4 sm:p-5 bg-dark-card/70 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
              >
                {item.icon} 
                <span className="ml-3 sm:ml-4 text-sm sm:text-base font-medium text-light-text">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
         
        </motion.div>
        <motion.div 
          className="flex-1 flex justify-center items-center w-full max-w-md mx-auto lg:max-w-lg mt-4 lg:mt-0" 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn}
        >
          <motion.div 
            className="relative w-full" 
            initial="initial" 
            animate="animate" 
            variants={floatAnimation}
          >
            <div className="bg-dark-card/80 backdrop-blur-xl border border-slate-700/80 p-8 sm:p-10 rounded-2xl shadow-2xl relative">
              <div className="flex items-center mb-8">
                <Activity className="text-emerald-400 mr-4 shrink-0" size={32} />
                <h3 className="text-xl sm:text-2xl font-semibold text-light-text">Patient Health Record</h3>
              </div>
              
              {/* Sample Data Fields */}
              <div className="space-y-4 mb-8 text-base">
                <div className="flex justify-between items-center">
                  <span className="text-medium-text font-medium">Patient Name:</span>
                  <span className="text-light-text bg-slate-700/50 px-3 py-1.5 rounded-md w-1/2 text-right truncate">Shrid Mishra</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-text font-medium">Date of Birth:</span>
                  <span className="text-light-text bg-slate-700/50 px-3 py-1.5 rounded-md w-1/2 text-right truncate">1990-07-26</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-text font-medium">Last Visit:</span>
                  <span className="text-light-text bg-slate-700/50 px-3 py-1.5 rounded-md w-1/2 text-right truncate">2025-03-15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-text font-medium">Primary Doctor:</span>
                  <span className="text-light-text bg-slate-700/50 px-3 py-1.5 rounded-md w-1/2 text-right truncate">Dr. S Jaishankar </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-text font-medium">Allergies:</span>
                  <span className="text-light-text bg-slate-700/50 px-3 py-1.5 rounded-md w-1/2 text-right truncate">Penicillin</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-700/60 backdrop-blur-sm rounded-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Shield className="text-emerald-400 mr-3 shrink-0" size={20} />
                    <span className="text-base font-medium text-medium-text">Blockchain Secured</span>
                  </div>
                  <motion.div 
                    initial="initial" 
                    animate="animate" 
                    variants={pulseAnimation} 
                    className="w-3 h-3 rounded-full bg-emerald-400 shadow-md"
                  ></motion.div>
                </div>
              </div>
              
              {/* Animated decorative elements */}
              <motion.div 
                className="absolute -top-6 -right-6 bg-theme-blue/30 backdrop-blur-lg p-4 rounded-xl border border-theme-blue/50 shadow-xl" 
                animate={{ y: [-5, 5, -5], rotate: [0, 5, 0] }} 
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              >
                <Share2 className="text-theme-blue-light" size={24} />
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-8 -left-8 bg-theme-green/30 backdrop-blur-lg p-4 rounded-xl border border-theme-green/50 shadow-xl" 
                animate={{ y: [5, -5, 5], rotate: [0, -5, 0] }} 
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
              >
                <Lock className="text-emerald-400" size={24} />
              </motion.div>
              
              {/* Gradient connectors */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-px h-16 bg-gradient-to-b from-emerald-400/50 to-transparent"></div>
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-px h-16 bg-gradient-to-t from-theme-blue-light/50 to-transparent"></div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 filter blur-xl -z-10"></div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Enhanced roadmap section with responsive SVG path */}
      <section 
        ref={roadmapRef as React.RefObject<HTMLElement>}
        className="relative z-10 w-full max-w-5xl mx-auto mb-24 px-4 mt-20"
      >
        <motion.h2 
          className="text-2xl sm:text-3xl font-bold mb-16 text-center bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          How MediChain Works
        </motion.h2>
        
        <div className="relative">
          {/* Central vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-slate-800/70 rounded-full hidden lg:block"></div>
          
          {/* Animated SVG path overlay */}
          <svg 
            className="absolute left-1/2 transform -translate-x-1/2 h-full z-0 hidden lg:block"
            style={{ width: "6px" }} 
            viewBox="0 0 6 1000"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M 3,0 L 3,1000"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={roadmapControls}
              variants={{
                hidden: { pathLength: 0 },
                visible: { 
                  pathLength: 1,
                  transition: { duration: 2.5, ease: "easeInOut" }
                }
              }}
              style={{
                stroke: "url(#lineGradient)",
                filter: "drop-shadow(0 0 3px rgba(52, 211, 153, 0.4))"
              }}
            />
            
            {/* Animated dot along the path */}
            <motion.circle
              cx="3"
              cy="0"
              r="4"
              fill="url(#dotGradient)"
              filter="drop-shadow(0 0 4px rgba(52, 211, 153, 0.7))"
              animate={{ 
                y: [0, 1000],
                transition: { 
                  duration: 10, 
                  ease: "linear", 
                  repeat: Infinity,
                  delay: 1
                }
              }}
            />
            
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" /> {/* emerald-500 */}
                <stop offset="50%" stopColor="#06b6d4" /> {/* cyan-500 */}
                <stop offset="100%" stopColor="#10b981" /> {/* emerald-500 */}
              </linearGradient>
              
              <radialGradient id="dotGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" /> {/* emerald-500 */}
                <stop offset="100%" stopColor="#06b6d4" /> {/* cyan-500 */}
              </radialGradient>
            </defs>
          </svg>

          {/* Stepped layout with proper spacing */}
          <div className="relative grid grid-cols-1 gap-24">
            {roadmapSteps.map((step, index) => (
              <div 
                key={index} 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* For odd indices, we add an empty div to push the content to the right */}
                {index % 2 !== 0 && <div className="hidden lg:block"></div>}
                
                <div className={index % 2 === 0 ? "lg:pr-12" : "lg:pl-12"}>
                  <AnimatedStep 
                    index={index}
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                  />
                </div>
                
                {/* For even indices, we add an empty div after the content */}
                {index % 2 === 0 && <div className="hidden lg:block"></div>}
              </div>
            ))}
          </div>
          
          {/* Decoration elements at the start and end of the line */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-dark-card rounded-full border-2 border-emerald-400 hidden lg:flex items-center justify-center">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
          </div>
          
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-dark-card rounded-full border-2 border-cyan-400 hidden lg:flex items-center justify-center">
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Added footer section */}
      <footer className="relative z-10 w-full bg-dark-card/30 backdrop-blur-md border-t border-slate-800 py-8">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Activity className="text-emerald-400 mr-3" size={24} />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">MediChain</span>
          </div>
          
          <div className="flex space-x-8 text-medium-text/80">
          <h1 className="items-center"> Built with    ❤️</h1>
          <motion.a 
              whileHover={{ color: "#638be1", scale: 1.05 }} 
              className="hover:text-white transition-colors mr-30" 
              href="https://shridmishra.vercel.app/"
            >
              Shrid Mishra
            </motion.a>
            <motion.a 
              whileHover={{ color: "#fff", scale: 1.05 }} 
              className="hover:text-white transition-colors" 
              href="https://shridmishra.vercel.app/"
            >
              Privacy
            </motion.a>
            <motion.a 
              whileHover={{ color: "#fff", scale: 1.05 }} 
              className="hover:text-white transition-colors" 
              href="https://shridmishra.vercel.app/"
            >
              Terms
            </motion.a>
            <motion.a 
              whileHover={{ color: "#fff", scale: 1.05 }} 
              className="hover:text-white transition-colors" 
              href="https://shridmishra.vercel.app/"
            >
              Contact
            </motion.a>
            <motion.a 
              whileHover={{ color: "#fff", scale: 1.05 }} 
              className="hover:text-white transition-colors" 
              href="https://shridmishra.vercel.app/"
            >
              About
            </motion.a>
          </div>
          
        </div>
        
        <div className="mt-12 text-center text-medium-text/60 text-sm">
          © 2025 MediChain. All rights reserved.
        </div>

        
      </footer>

      {publicKey && (
        <RoleSelectionModal 
          isOpen={needsRole} 
          publicKey={publicKey.toBase58()} 
          onRoleSelected={handleRoleSelected} 
        />
      )}

      {/* Toast notification with animation */}
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold
            ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
        >
          {toast.message}
          <button 
            className="ml-4 text-white/80 hover:text-white font-bold" 
            onClick={() => setToast(null)}
          >
            &times;
          </button>
        </motion.div>
      )}
    </div>
  );
}
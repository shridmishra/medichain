import { useWallet } from '@solana/wallet-adapter-react';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Sora } from 'next/font/google';
import { Activity, BriefcaseMedical, Search, UserCircle, ListChecks, Copy, XCircle, Download, FileUp, Clock, CheckCircle2, XCircle as XCircleIcon } from 'lucide-react'; // Icons for doctor page
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Toast from '../../components/Toast';
import Header from '../../components/Header';
import { motion } from 'framer-motion';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

// Configure Sora font locally for this page
const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

interface Record {
  id: string;
  name: string;
  uploadDate: string;
  createdAt: string;
  tags?: string[];
  doctorId?: string;
  patientId?: string;
  patient?: {
    publicKey: string;
  };
  status?: 'PENDING' | 'APPROVED' | 'DENIED';
  reason?: string;
  pointer?: string;
}

export default function DoctorDashboard() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [patientPublicKey, setPatientPublicKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [accessibleRecords, setAccessibleRecords] = useState<Record[]>([]);
  const [accessRequests, setAccessRequests] = useState<Record[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [accessToWithdraw, setAccessToWithdraw] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [requestToRevoke, setRequestToRevoke] = useState<string | null>(null);
  const [downloadingRecord, setDownloadingRecord] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [recordToDownload, setRecordToDownload] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      router.push('/');
    }
  }, [publicKey, router]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const fetchAccessRequests = async () => {
    if (!publicKey) return;
    try {
      const response = await fetch(`/api/access-request?doctorPublicKey=${publicKey.toBase58()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch access requests');
      }
      const data = await response.json();
      setAccessRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      showToast(error instanceof Error ? error.message : 'Failed to fetch access requests', 'error');
    }
  };

  const handleRequestAccess = async () => {
    if (!patientPublicKey) {
      showToast('Please enter a patient public key', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorPublicKey: publicKey?.toBase58(),
          patientPublicKey,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send access request');
      }
      
      showToast('Access request sent successfully!', 'success');
      setPatientPublicKey('');
      fetchAccessRequests(); // Refresh access requests
    } catch (error) {
      console.error('Error sending access request:', error);
      showToast(error instanceof Error ? error.message : 'Failed to send access request', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRecords = async () => {
      if (!publicKey) return;
      setRecordsLoading(true);
      try {
        const response = await fetch(`/api/records?publicKey=${publicKey.toBase58()}`);
        if (!response.ok) throw new Error('Failed to fetch records');
        const data = await response.json();
        setAccessibleRecords(data.records);
      } catch (error) {
        console.error('Error fetching records:', error);
        showToast('Failed to fetch records', 'error');
      } finally {
        setRecordsLoading(false);
      }
    };

    fetchRecords();
    fetchAccessRequests();
  }, [publicKey]);

  const RecordSkeleton = () => (
    <div className="bg-slate-700/50 p-4 rounded-lg animate-pulse">
      <div className="h-4 bg-slate-600 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-slate-600 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-slate-600 rounded w-1/3"></div>
    </div>
  );

  const handleWithdrawAccess = async (patientId: string) => {
    try {
      const response = await fetch('/api/access/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });

      if (!response.ok) throw new Error('Failed to withdraw access');

      setAccessibleRecords(accessibleRecords.filter(r => r.patientId !== patientId));
      setShowWithdrawModal(false);
      setAccessToWithdraw(null);
      showToast('Access withdrawn successfully', 'success');
    } catch (error) {
      console.error('Error withdrawing access:', error);
      showToast('Failed to withdraw access', 'error');
    }
  };

  const handleRevokeRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/access-request/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) throw new Error('Failed to revoke request');

      setAccessRequests(accessRequests.filter(r => r.id !== requestId));
      setShowRevokeModal(false);
      setRequestToRevoke(null);
      showToast('Request revoked successfully', 'success');
    } catch (error) {
      console.error('Error revoking request:', error);
      showToast('Failed to revoke request', 'error');
    }
  };

  const handleDownloadRecord = async (recordId: string) => {
    setDownloadingRecord(recordId);
    try {
      // Convert string id to integer if needed
      const numericId = parseInt(recordId, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid record ID');
      }

      const response = await fetch(`/api/records/${numericId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download record');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename=(.+)/);
      const filename = filenameMatch ? filenameMatch[1] : `record-${recordId}`;

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast('Record downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading record:', error);
      showToast(error instanceof Error ? error.message : 'Failed to download record', 'error');
    } finally {
      setDownloadingRecord(null);
      setShowDownloadModal(false);
      setRecordToDownload(null);
    }
  };

  return (
    <div className={`${sora.className} min-h-screen bg-dark-bg text-light-text flex flex-col px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32`}>
      <Head>
        <title>Doctor Dashboard - MediChain</title>
        <meta name="description" content="Access and manage patient records with permission" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="fixed inset-0 w-full min-h-screen bg-gradient-to-br from-dark-bg via-slate-800 to-dark-bg -z-10"></div>

      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div className="absolute top-10 left-5 w-72 h-72 rounded-full bg-theme-blue/20 blur-3xl opacity-60" animate={{ x: [0, 40, 0], y: [0, -20, 0]}} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }} />
        <motion.div className="absolute bottom-10 right-5 w-96 h-96 rounded-full bg-theme-green/20 blur-3xl opacity-50" animate={{ x: [0, -40, 0], y: [0, 20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }} />
        <motion.div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl opacity-70" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }} />
      </div>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <div className="flex flex-col gap-10 md:gap-12">
          <section id="doctor-info" className="bg-gradient-to-br from-dark-card/70 to-dark-card/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-lg">
            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-6 flex items-center gap-3">
              <BriefcaseMedical size={36} className="shrink-0"/> Doctor Dashboard
            </h1>
            {publicKey ? (
              <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-light-text mb-3">Your Information</h2>
                <div className="flex items-center gap-2">
                  <p className="text-md text-medium-text">Wallet Address:</p>
                  <code className="font-mono text-emerald-400 text-sm">{publicKey.toBase58()}</code>
                  <button
                    onClick={() => copyToClipboard(publicKey.toBase58(), 'wallet')}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} className={copySuccess === 'wallet' ? 'text-emerald-400' : 'text-slate-400'} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 text-center">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
                <p className="text-medium-text">Please connect your wallet to view your dashboard.</p>
              </div>
            )}
          </section>

          {publicKey && (
            <section id="patient-records-access" className="bg-gradient-to-br from-dark-card/70 to-dark-card/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-emerald-400 mb-6 flex items-center gap-2.5">
                <Search size={28} className="shrink-0" /> Request Patient Access
              </h2>
              <div className="mb-6">
                <label htmlFor="patientPublicKey" className="block text-base font-medium text-medium-text mb-2">Enter Patient Public Key:</label>
                <div className="relative">
                  <input
                    id="patientPublicKey"
                    type="text"
                    value={patientPublicKey}
                    onChange={(e) => setPatientPublicKey(e.target.value)}
                    className="w-full text-base text-light-text bg-slate-700/50 border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Patient's Public Key"
                  />
                  {patientPublicKey && (
                    <button
                      onClick={() => copyToClipboard(patientPublicKey, 'patient')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} className={copySuccess === 'patient' ? 'text-emerald-400' : 'text-slate-400'} />
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestAccess}
                disabled={!patientPublicKey || loading}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer"
              >
                {loading ? 'Sending Request...' : 'Request Access'}
              </button>
            </section>
          )}

          {publicKey && (
            <section id="access-requests" className="bg-gradient-to-br from-dark-card/70 to-dark-card/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-emerald-400 mb-6 flex items-center gap-2.5">
                <Clock size={28} className="shrink-0"/> Pending Access Requests
              </h2>
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {accessRequests.length > 0 ? (
                  <div className="grid gap-4">
                    {accessRequests.map((request) => (
                      <div key={request.id} className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-light-text mb-2">
                              {request.patient?.publicKey || request.patientId || 'Unknown Patient'}
                            </h3>
                            <p className="text-medium-text text-sm">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
                            <p className="text-medium-text text-sm mt-1">Status: <span className={request.status === 'APPROVED' ? 'text-emerald-400' : request.status === 'DENIED' ? 'text-red-400' : 'text-yellow-400'}>{request.status || 'PENDING'}</span></p>
                          </div>
                          {request.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setRequestToRevoke(request.id);
                                setShowRevokeModal(true);
                              }}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Revoke Request"
                            >
                              <XCircleIcon size={20} />
                            </button>
                          )}
                        </div>
                        {request.reason && <p className="text-medium-text">{request.reason}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-medium-text italic">No pending access requests.</p>
                )}
              </div>
            </section>
          )}

          {publicKey && (
            <section id="accessible-records" className="bg-gradient-to-br from-dark-card/70 to-dark-card/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-emerald-400 mb-6 flex items-center gap-2.5">
                <ListChecks size={28} className="shrink-0"/> Accessible Records
              </h2>
              {recordsLoading ? (
                <div className="space-y-4">
                  <RecordSkeleton />
                  <RecordSkeleton />
                  <RecordSkeleton />
                </div>
              ) : accessibleRecords.length > 0 ? (
                <div className="grid gap-6">
                  {accessibleRecords.map((record) => (
                    <div key={record.id} className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-light-text mb-2">{record.name || 'Untitled Record'}</h3>
                          <p className="text-medium-text text-sm">
                            Uploaded on {new Date(record.createdAt || record.uploadDate).toLocaleDateString()}
                          </p>
                          {record.patient?.publicKey && (
                            <p className="text-medium-text text-sm mt-1">
                              Patient: {record.patient.publicKey.slice(0, 4)}...{record.patient.publicKey.slice(-4)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRecordToDownload(record.id);
                              setShowDownloadModal(true);
                            }}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Download Record"
                          >
                            <Download size={20} />
                          </button>
                         
                        </div>
                      </div>
                      {record.tags && record.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {record.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-medium-text italic">No accessible records found.</p>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Download Record Modal */}
      {showDownloadModal && recordToDownload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card/90 backdrop-blur-md border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-light-text mb-4">Download Record</h3>
            <p className="text-medium-text mb-6">Are you sure you want to download this record?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  setRecordToDownload(null);
                }}
                className="px-4 py-2 text-medium-text hover:text-light-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDownloadRecord(recordToDownload)}
                disabled={downloadingRecord === recordToDownload}
                className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingRecord === recordToDownload ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Access Modal */}
      {showWithdrawModal && accessToWithdraw && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card/90 backdrop-blur-md border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-light-text mb-4">Withdraw Access</h3>
            <p className="text-medium-text mb-6">Are you sure you want to withdraw your access to this patient's records?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setAccessToWithdraw(null);
                }}
                className="px-4 py-2 text-medium-text hover:text-light-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdrawAccess(accessToWithdraw)}
                className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Request Modal */}
      {showRevokeModal && requestToRevoke && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card/90 backdrop-blur-md border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-light-text mb-4">Revoke Request</h3>
            <p className="text-medium-text mb-6">Are you sure you want to revoke this access request?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setRequestToRevoke(null);
                }}
                className="px-4 py-2 text-medium-text hover:text-light-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevokeRequest(requestToRevoke)}
                className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
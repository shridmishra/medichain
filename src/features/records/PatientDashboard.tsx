import { useWallet } from '@solana/wallet-adapter-react';
import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { Sora } from 'next/font/google';
import { Activity, UploadCloud, ListChecks, UserCircle, Copy, Trash2, Download, XCircle, CheckCircle, Loader2, FileText, ExternalLink, Clock } from 'lucide-react'; // Icons for patient page
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
  url?: string;
}

interface AccessRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  reason: string;
  doctor?: {
    publicKey: string;
    name: string;
  };
  createdAt?: string;
}

export default function PatientDashboard() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [recordFile, setRecordFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [records, setRecords] = useState<Record[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [requestToRevoke, setRequestToRevoke] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [recordToDownload, setRecordToDownload] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      router.push('/');
    }
  }, [publicKey, router]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  }, []);

  const fetchRecords = useCallback(async () => {
    if (!publicKey) return;
    setRecordsLoading(true);
    try {
      const response = await fetch(`/api/records?publicKey=${publicKey.toBase58()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch records');
      }
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      showToast(error instanceof Error ? error.message : 'Failed to fetch records', 'error');
    } finally {
      setRecordsLoading(false);
    }
  }, [publicKey, showToast]);

  const fetchAccessRequests = useCallback(async () => {
    if (!publicKey) return;
    setRequestsLoading(true);
    try {
      const response = await fetch(`/api/access-request/patient?patientPublicKey=${publicKey.toBase58()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch access requests');
      }
      const data = await response.json();
      setAccessRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      showToast(error instanceof Error ? error.message : 'Failed to fetch access requests', 'error');
    } finally {
      setRequestsLoading(false);
    }
  }, [publicKey, showToast]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRecordFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!recordFile || !publicKey) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', recordFile);
    formData.append('publicKey', publicKey.toBase58());

    try {
      const response = await fetch('/api/records/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();
      showToast('File uploaded successfully!', 'success');
      await fetchRecords(); // Refresh records after upload
      setRecordFile(null); // Clear the selected file
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast(error instanceof Error ? error.message : 'Failed to upload file. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/access-request/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'approved' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve access request');
      }

      showToast('Access request approved!', 'success');
      await fetchAccessRequests(); // Refresh requests after approval
    } catch (error) {
      console.error('Error approving access request:', error);
      showToast(error instanceof Error ? error.message : 'Error approving access request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/access-request/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'denied' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deny access request');
      }

      showToast('Access request denied!', 'success');
      await fetchAccessRequests(); // Refresh requests after denial
    } catch (error) {
      console.error('Error denying access request:', error);
      showToast(error instanceof Error ? error.message : 'Error denying access request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/records/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: parseInt(recordId) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete record');
      }

      await fetchRecords(); // Refresh records after deletion
      setShowDeleteModal(false);
      setRecordToDelete(null);
      showToast('Record deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting record:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRequest = async (requestId: string) => {
    setRevokeLoading(true);
    try {
      const response = await fetch('/api/access-request/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke request');
      }

      await fetchAccessRequests(); // Refresh from backend
      setShowRevokeModal(false);
      setRequestToRevoke(null);
      showToast('Request revoked successfully', 'success');
    } catch (error) {
      console.error('Error revoking request:', error);
      showToast(error instanceof Error ? error.message : 'Failed to revoke request', 'error');
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleDownload = async (recordId: string) => {
    setDownloadLoading(true);
    try {
      const record = records.find(r => r.id === recordId);
      if (!record) throw new Error('Record not found');

      // Open the IPFS URL in a new tab
      window.open(record.url, '_blank');
      
      setShowDownloadModal(false);
      setRecordToDownload(null);
      showToast('Opening record in new tab', 'success');
    } catch (error) {
      console.error('Error downloading record:', error);
      showToast(error instanceof Error ? error.message : 'Failed to download record', 'error');
    } finally {
      setDownloadLoading(false);
    }
  };

  const RecordSkeleton = () => (
    <div className="bg-slate-700/50 p-4 rounded-lg animate-pulse">
      <div className="h-4 bg-slate-600 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-slate-600 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-slate-600 rounded w-1/3"></div>
    </div>
  );

  useEffect(() => {
    if (publicKey) {
      fetchAccessRequests();
      fetchRecords();
    }
  }, [publicKey, fetchAccessRequests, fetchRecords]);

  // Helper to normalize status
  const normalizeStatus = (status: string) => status?.toUpperCase?.() || '';

  const filteredRequests = accessRequests.filter(
    req => normalizeStatus(req.status) !== 'REVOKED'
  );

  return (
    <div className={`${sora.className} min-h-screen bg-dark-bg text-light-text flex flex-col px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32`}>
      <Head>
        <title>Patient Dashboard - MediChain</title>
        <meta name="description" content="Manage your medical records on MediChain." />
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
        <div className="flex flex-col gap-10 md:gap-12">
          <section id="patient-info" className="bg-gradient-to-br from-dark-card/70 to-dark-card/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-lg">
            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-6 flex items-center gap-3">
              <UserCircle size={36} className="shrink-0"/> Patient Dashboard
            </h1>
            {publicKey ? (
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-xl font-semibold text-light-text mb-4">Your Information</h2>
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
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50 text-center">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
                <p className="text-medium-text">Please connect your wallet to view your dashboard.</p>
              </div>
            )}
          </section>

          {publicKey && (
            <section id="upload-record" className="bg-gradient-to-br from-dark-card/70 to-dark-card/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-emerald-400 mb-6 flex items-center gap-2.5">
                <UploadCloud size={28} className="shrink-0"/> Upload Medical Record
              </h2>
              <div className="space-y-6">
                <div className="relative">
                  <input
                    id="recordFile"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="recordFile"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-12 h-12 mb-3 text-emerald-400" />
                      <p className="mb-2 text-sm text-medium-text">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-medium-text">PDF, DOC, DOCX, or Images</p>
                    </div>
                  </label>
                  {recordFile && (
                    <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <p className="text-light-text flex items-center gap-2">
                        <FileText className="text-emerald-400" size={20} />
                        {recordFile.name}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={!recordFile || loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Record'
                  )}
                </button>
              </div>
            </section>
          )}

          {publicKey && (
            <section id="your-records" className="bg-gradient-to-br from-dark-card/70 to-dark-card/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-emerald-400 mb-6 flex items-center gap-2.5">
                <ListChecks size={28} className="shrink-0"/> Your Records
              </h2>
              {recordsLoading ? (
                <div className="space-y-4">
                  <RecordSkeleton />
                  <RecordSkeleton />
                  <RecordSkeleton />
                </div>
              ) : records.length > 0 ? (
                <div className="grid gap-6">
                  {records.map((record) => (
                    <div key={record.id} className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-light-text mb-2">Medical Record</h3>
                          <p className="text-medium-text text-sm">
                            Uploaded on {new Date(record.createdAt || record.uploadDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRecordToDelete(record.id);
                              setShowDeleteModal(true);
                            }}
                            disabled={loading}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            title="Delete Record"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 size={20} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRecordToDownload(record.id);
                              setShowDownloadModal(true);
                            }}
                            disabled={downloadLoading}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            title="Download Record"
                          >
                            {downloadLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download size={20} />
                            )}
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
                <p className="text-medium-text italic">No records uploaded yet.</p>
              )}
            </section>
          )}

          {publicKey && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2.5">
                <Clock size={28} className="shrink-0 text-emerald-400"/>
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Access Requests</span>
              </h2>
              {requestsLoading ? (
                <div className="space-y-4">
                  <div className="bg-slate-800/30 animate-pulse h-24 rounded-xl"></div>
                  <div className="bg-slate-800/30 animate-pulse h-24 rounded-xl"></div>
                </div>
              ) : filteredRequests.length > 0 ? (
                <div className="space-y-8">
                  {/* Pending Requests Section */}
                  {filteredRequests.filter(req => normalizeStatus(req.status) === 'PENDING').length > 0 && (
                    <div className="max-h-[300px] overflow-y-auto pr-2 border border-slate-700/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-yellow-400 mb-4">Pending Requests</h3>
                      <div className="space-y-4">
                        {filteredRequests.filter(req => normalizeStatus(req.status) === 'PENDING').map((request) => {
                          let dateStr = 'Unknown Date';
                          if (request.createdAt) {
                            const d = new Date(request.createdAt);
                            dateStr = isNaN(d.getTime()) ? 'Unknown Date' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                          }
                          return (
                            <div key={request.id} className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-light-text mb-2">Doctor</h3>
                                  <p className="text-medium-text text-sm">Requested on {dateStr}</p>
                                  <p className="text-medium-text text-sm mt-1">Status: <span className="text-yellow-400">pending</span></p>
                                  {request.doctor?.publicKey && (
                                    <p className="text-medium-text text-sm mt-1">Doctor ID: {request.doctor.publicKey.slice(0, 4)}...{request.doctor.publicKey.slice(-4)}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveRequest(request.id)}
                                    disabled={loading}
                                    className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                    title="Approve Request"
                                  >
                                    {loading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle size={20} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDenyRequest(request.id)}
                                    disabled={loading}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                    title="Deny Request"
                                  >
                                    {loading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle size={20} />
                                    )}
                                  </button>
                                </div>
                              </div>
                              {request.reason && (
                                <p className="text-medium-text">{request.reason}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Approved Requests Section (Revoke) */}
                  {filteredRequests.filter(req => normalizeStatus(req.status) === 'APPROVED').length > 0 && (
                    <div className="max-h-[300px] overflow-y-auto pr-2 border border-slate-700/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-emerald-400 mb-4">Revoke Access</h3>
                      <div className="space-y-4">
                        {filteredRequests.filter(req => normalizeStatus(req.status) === 'APPROVED').map((request) => {
                          let dateStr = 'Unknown Date';
                          if (request.createdAt) {
                            const d = new Date(request.createdAt);
                            dateStr = isNaN(d.getTime()) ? 'Unknown Date' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                          }
                          return (
                            <div key={request.id} className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-light-text mb-2">Doctor</h3>
                                  <p className="text-medium-text text-sm">Requested on {dateStr}</p>
                                  <p className="text-medium-text text-sm mt-1">Status: <span className="text-emerald-400">approved</span></p>
                                  {request.doctor?.publicKey && (
                                    <p className="text-medium-text text-sm mt-1">Doctor ID: {request.doctor.publicKey.slice(0, 4)}...{request.doctor.publicKey.slice(-4)}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setRequestToRevoke(request.id);
                                      setShowRevokeModal(true);
                                    }}
                                    disabled={revokeLoading}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                    title="Revoke Access"
                                  >
                                    {revokeLoading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle size={20} />
                                    )}
                                  </button>
                                </div>
                              </div>
                              {request.reason && (
                                <p className="text-medium-text">{request.reason}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Denied Requests Section */}
                  {filteredRequests.filter(req => normalizeStatus(req.status) === 'DENIED').length > 0 && (
                    <div className="max-h-[300px] overflow-y-auto pr-2 border border-slate-700/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-red-400 mb-4">Denied Requests</h3>
                      <div className="space-y-4">
                        {filteredRequests.filter(req => normalizeStatus(req.status) === 'DENIED').map((request) => {
                          let dateStr = 'Unknown Date';
                          if (request.createdAt) {
                            const d = new Date(request.createdAt);
                            dateStr = isNaN(d.getTime()) ? 'Unknown Date' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                          }
                          return (
                            <div key={request.id} className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-light-text mb-2">Doctor</h3>
                                  <p className="text-medium-text text-sm">Requested on {dateStr}</p>
                                  <p className="text-medium-text text-sm mt-1">Status: <span className="text-red-400">denied</span></p>
                                  {request.doctor?.publicKey && (
                                    <p className="text-medium-text text-sm mt-1">Doctor ID: {request.doctor.publicKey.slice(0, 4)}...{request.doctor.publicKey.slice(-4)}</p>
                                  )}
                                </div>
                              </div>
                              {request.reason && (
                                <p className="text-medium-text">{request.reason}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-medium-text italic">No access requests found.</p>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Delete Record Modal */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card/90 backdrop-blur-md border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-light-text mb-4">Delete Record</h3>
            <p className="text-medium-text mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRecordToDelete(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-medium-text hover:text-light-text transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRecord(recordToDelete)}
                disabled={loading}
                className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Access Modal */}
      {showRevokeModal && requestToRevoke && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card/90 backdrop-blur-md border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-light-text mb-4">Revoke Access</h3>
            <p className="text-medium-text mb-6">Are you sure you want to revoke access for this doctor? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setRequestToRevoke(null);
                }}
                disabled={revokeLoading}
                className="px-4 py-2 text-medium-text hover:text-light-text transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevokeRequest(requestToRevoke)}
                disabled={revokeLoading}
                className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {revokeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  'Revoke'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Record Modal */}
      {showDownloadModal && recordToDownload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-card/90 backdrop-blur-md border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-light-text mb-4">Download Record</h3>
            <p className="text-medium-text mb-6">This will open the record in a new tab. Would you like to continue?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  setRecordToDownload(null);
                }}
                disabled={downloadLoading}
                className="px-4 py-2 text-medium-text hover:text-light-text transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDownload(recordToDownload)}
                disabled={downloadLoading}
                className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {downloadLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} />
                    Open Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
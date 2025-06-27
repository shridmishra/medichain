import { useState } from 'react';
import { CheckCircle, User, BriefcaseMedical } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  publicKey: string;
  onRoleSelected: (role: 'PATIENT' | 'DOCTOR') => void;
}

export default function RoleSelectionModal({ isOpen, publicKey, onRoleSelected }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'DOCTOR' | null>(null);
  const [loading, setLoading] = useState(false);

  // console.log('RoleSelectionModal rendered, isOpen:', isOpen, 'publicKey:', publicKey);

  const handleSubmit = async () => {
    if (selectedRole) {
      setLoading(true);
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey, role: selectedRole }),
        });
        if (response.ok) {
          // console.log('Role updated successfully');
          onRoleSelected(selectedRole);
        } else {
          console.error('Failed to update role:', response.statusText);
          // Handle error display to user if necessary
        }
      } catch (error) {
        console.error('Error updating role:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) {
    // console.log('Modal not open, returning null');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      {/* Increased max-width, adjusted padding for a more spacious feel */}
      <div className="bg-dark-card border border-slate-700/80 p-8 sm:p-12 rounded-2xl shadow-2xl max-w-lg w-full text-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-emerald-400">Select Your Role</h2>
        <p className="mb-10 text-lg text-medium-text">Choose your primary role to access MediChain features.</p>
        
        <div className="space-y-6 mb-12">
          <button
            type="button"
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ease-in-out flex items-center justify-center gap-3.5 transform hover:scale-105 shadow-md hover:shadow-emerald-500/30 cursor-pointer
                        ${selectedRole === 'PATIENT' 
                          ? 'bg-emerald-500 text-white ring-2 ring-offset-2 ring-offset-dark-card ring-emerald-300' 
                          : 'bg-slate-700 text-light-text hover:bg-slate-600 border border-slate-600 hover:border-slate-500'}`}
            onClick={() => setSelectedRole('PATIENT')}
          >
            <User size={24} /> Patient
          </button>
          <button
            type="button"
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ease-in-out flex items-center justify-center gap-3.5 transform hover:scale-105 shadow-md hover:shadow-emerald-500/30 cursor-pointer
                        ${selectedRole === 'DOCTOR' 
                          ? 'bg-emerald-500 text-white ring-2 ring-offset-2 ring-offset-dark-card ring-emerald-300' 
                          : 'bg-slate-700 text-light-text hover:bg-slate-600 border border-slate-600 hover:border-slate-500'}`}
            onClick={() => setSelectedRole('DOCTOR')}
          >
            <BriefcaseMedical size={24} /> Doctor
          </button>
        </div>
        
        <button
          type="button"
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-4 px-8 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center text-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-lg cursor-pointer"
          onClick={handleSubmit}
          disabled={!selectedRole || loading}
        >
          {loading ? 'Confirming...' : 'Confirm and Continue'}
          {!loading && <CheckCircle size={22} className="ml-3"/>}
        </button>
      </div>
    </div>
  );
}
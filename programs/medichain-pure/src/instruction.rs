use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::program_error::ProgramError;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum MedichainInstruction {
    CreatePatientRecord,
    AddRecordPointer { pointer_uri: String },
    GrantAccess,
    RevokeAccess,
}

impl MedichainInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(input).map_err(|_| ProgramError::InvalidInstructionData)
    }
} 
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

pub const MAX_URI_LENGTH: usize = 100;

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct PatientRecord {
    pub patient: Pubkey,
    pub authority: Pubkey,
    pub record_count: u64,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct MedicalRecordPointer {
    pub patient_record: Pubkey,
    pub pointer_uri: String,
    pub added_at: i64,
    pub bump: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct AccessGrant {
    pub patient_record: Pubkey,
    pub doctor: Pubkey,
    pub granted_at: i64,
    pub bump: u8,
} 
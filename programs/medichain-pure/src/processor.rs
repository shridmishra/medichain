use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program_error::ProgramError,
    program_pack::Pack,
    sysvar::{clock::Clock, Sysvar},
    rent::Rent,
    program::{invoke_signed},
    system_instruction,
};

use crate::{
    instruction::MedichainInstruction,
    state::PatientRecord,
    error::MedichainError,
};

use borsh::{BorshSerialize, BorshDeserialize};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = MedichainInstruction::unpack(instruction_data)?;
        match instruction {
            MedichainInstruction::CreatePatientRecord => {
                Self::process_create_patient_record(program_id, accounts)
            }
            MedichainInstruction::AddRecordPointer { pointer_uri } => {
                Self::process_add_record_pointer(program_id, accounts, pointer_uri)
            }
            MedichainInstruction::GrantAccess => {
                Self::process_grant_access(program_id, accounts)
            }
            MedichainInstruction::RevokeAccess => {
                Self::process_revoke_access(program_id, accounts)
            }
        }
    }

    fn process_create_patient_record(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let patient_record_info = next_account_info(account_info_iter)?;
        let patient_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;

        // Patient must be signer
        if !patient_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Derive PDA for patient_record
        let (pda, bump) = Pubkey::find_program_address(
            &[b"patient_record", patient_info.key.as_ref()],
            program_id,
        );
        if pda != *patient_record_info.key {
            return Err(ProgramError::InvalidSeeds);
        }

        // Allocate and assign account if not already initialized
        if patient_record_info.data_is_empty() {
            let rent = Rent::get()?;
            let required_lamports = rent.minimum_balance(PatientRecord::default().try_to_vec()?.len());
            let space = PatientRecord::default().try_to_vec()?.len();
            invoke_signed(
                &system_instruction::create_account(
                    patient_info.key,
                    patient_record_info.key,
                    required_lamports,
                    space as u64,
                    program_id,
                ),
                &[patient_info.clone(), patient_record_info.clone(), system_program_info.clone()],
                &[&[b"patient_record", patient_info.key.as_ref(), &[bump]]],
            )?;
        }

        // Initialize data
        let mut patient_record = PatientRecord::try_from_slice(&patient_record_info.data.borrow())?;
        patient_record.patient = *patient_info.key;
        patient_record.authority = *patient_info.key;
        patient_record.record_count = 0;
        patient_record.created_at = Clock::get()?.unix_timestamp;
        patient_record.bump = bump;
        patient_record.serialize(&mut &mut patient_record_info.data.borrow_mut()[..])?;
        Ok(())
    }

    fn process_add_record_pointer(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        pointer_uri: String,
    ) -> ProgramResult {
        use crate::state::{MedicalRecordPointer, MAX_URI_LENGTH};
        use crate::error::MedichainError;
        use borsh::BorshSerialize;

        let account_info_iter = &mut accounts.iter();
        let patient_record_info = next_account_info(account_info_iter)?;
        let record_pointer_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;

        // Check authority is signer
        if !authority_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Deserialize patient record
        let mut patient_record = crate::state::PatientRecord::try_from_slice(&patient_record_info.data.borrow())?;
        if patient_record.authority != *authority_info.key {
            return Err(MedichainError::Unauthorized.into());
        }

        // Validate URI length
        if pointer_uri.len() > MAX_URI_LENGTH {
            return Err(MedichainError::UriTooLong.into());
        }

        // Derive PDA for record pointer
        let record_count_bytes = patient_record.record_count.to_le_bytes();
        let (pda, bump) = Pubkey::find_program_address(
            &[b"record_pointer", patient_record_info.key.as_ref(), &record_count_bytes],
            program_id,
        );
        if pda != *record_pointer_info.key {
            return Err(ProgramError::InvalidSeeds);
        }

        // Allocate and assign account if not already initialized
        if record_pointer_info.data_is_empty() {
            let rent = Rent::get()?;
            let space = MedicalRecordPointer::default().try_to_vec()?.len() + 4 + MAX_URI_LENGTH;
            let required_lamports = rent.minimum_balance(space);
            invoke_signed(
                &system_instruction::create_account(
                    authority_info.key,
                    record_pointer_info.key,
                    required_lamports,
                    space as u64,
                    program_id,
                ),
                &[authority_info.clone(), record_pointer_info.clone(), system_program_info.clone()],
                &[&[b"record_pointer", patient_record_info.key.as_ref(), &record_count_bytes, &[bump]]],
            )?;
        }

        // Initialize record pointer data
        let mut record_pointer = MedicalRecordPointer::try_from_slice(&record_pointer_info.data.borrow())?;
        record_pointer.patient_record = *patient_record_info.key;
        record_pointer.pointer_uri = pointer_uri;
        record_pointer.added_at = Clock::get()?.unix_timestamp;
        record_pointer.bump = bump;
        record_pointer.serialize(&mut &mut record_pointer_info.data.borrow_mut()[..])?;

        // Increment record count on patient record
        patient_record.record_count = patient_record
            .record_count
            .checked_add(1)
            .ok_or(MedichainError::Overflow)?;
        patient_record.serialize(&mut &mut patient_record_info.data.borrow_mut()[..])?;
        Ok(())
    }

    fn process_grant_access(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
    ) -> ProgramResult {
        use crate::state::AccessGrant;
        use crate::error::MedichainError;
        use borsh::BorshSerialize;

        let account_info_iter = &mut accounts.iter();
        let patient_record_info = next_account_info(account_info_iter)?;
        let access_grant_info = next_account_info(account_info_iter)?;
        let doctor_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;

        // Check authority is signer
        if !authority_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Deserialize patient record
        let patient_record = crate::state::PatientRecord::try_from_slice(&patient_record_info.data.borrow())?;
        if patient_record.authority != *authority_info.key {
            return Err(MedichainError::Unauthorized.into());
        }

        // Derive PDA for access grant
        let (pda, bump) = Pubkey::find_program_address(
            &[b"access_grant", patient_record_info.key.as_ref(), doctor_info.key.as_ref()],
            program_id,
        );
        if pda != *access_grant_info.key {
            return Err(ProgramError::InvalidSeeds);
        }

        // Allocate and assign account if not already initialized
        if access_grant_info.data_is_empty() {
            let rent = Rent::get()?;
            let space = AccessGrant::default().try_to_vec()?.len();
            let required_lamports = rent.minimum_balance(space);
            invoke_signed(
                &system_instruction::create_account(
                    authority_info.key,
                    access_grant_info.key,
                    required_lamports,
                    space as u64,
                    program_id,
                ),
                &[authority_info.clone(), access_grant_info.clone(), system_program_info.clone()],
                &[&[b"access_grant", patient_record_info.key.as_ref(), doctor_info.key.as_ref(), &[bump]]],
            )?;
        }

        // Initialize access grant data
        let mut access_grant = AccessGrant::try_from_slice(&access_grant_info.data.borrow())?;
        access_grant.patient_record = *patient_record_info.key;
        access_grant.doctor = *doctor_info.key;
        access_grant.granted_at = Clock::get()?.unix_timestamp;
        access_grant.bump = bump;
        access_grant.serialize(&mut &mut access_grant_info.data.borrow_mut()[..])?;
        Ok(())
    }

    fn process_revoke_access(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
    ) -> ProgramResult {
        use crate::error::MedichainError;
        let account_info_iter = &mut accounts.iter();
        let patient_record_info = next_account_info(account_info_iter)?;
        let access_grant_info = next_account_info(account_info_iter)?;
        let doctor_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;

        // Check authority is signer
        if !authority_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Deserialize patient record
        let patient_record = crate::state::PatientRecord::try_from_slice(&patient_record_info.data.borrow())?;
        if patient_record.authority != *authority_info.key {
            return Err(MedichainError::Unauthorized.into());
        }

        // Derive PDA for access grant
        let (pda, _bump) = Pubkey::find_program_address(
            &[b"access_grant", patient_record_info.key.as_ref(), doctor_info.key.as_ref()],
            program_id,
        );
        if pda != *access_grant_info.key {
            return Err(ProgramError::InvalidSeeds);
        }

        // Close the access grant account: transfer lamports to authority and zero data
        **authority_info.lamports.borrow_mut() += **access_grant_info.lamports.borrow();
        **access_grant_info.lamports.borrow_mut() = 0;
        access_grant_info.data.borrow_mut().fill(0);
        Ok(())
    }
} 
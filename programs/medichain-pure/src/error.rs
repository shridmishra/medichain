use solana_program::program_error::ProgramError;

#[derive(Debug)]
pub enum MedichainError {
    UriTooLong,
    Unauthorized,
    Overflow,
}

impl From<MedichainError> for ProgramError {
    fn from(e: MedichainError) -> Self {
        match e {
            MedichainError::UriTooLong => ProgramError::Custom(0),
            MedichainError::Unauthorized => ProgramError::Custom(1),
            MedichainError::Overflow => ProgramError::Custom(2),
        }
    }
} 
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Track {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub bpm: f64,
    pub key: String,
    pub energy: u8,
    pub rating: Option<u8>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CamelotKey {
    pub number: u8,
    pub letter: char,
}

impl CamelotKey {
    pub fn parse(raw: &str) -> Option<Self> {
        let clean = raw.trim().to_uppercase();
        if clean.len() < 2 || clean.len() > 3 {
            return None;
        }

        let letter = clean.chars().last()?;
        if letter != 'A' && letter != 'B' {
            return None;
        }

        let num_str = &clean[..clean.len() - 1];
        let number: u8 = num_str.parse().ok()?;

        if (1..=12).contains(&number) {
            Some(CamelotKey { number, letter })
        } else {
            None
        }
    }

    pub fn is_compatible_with(&self, other: &CamelotKey) -> bool {
        if self.letter == other.letter {
            let diff = (self.number as i16 - other.number as i16).abs();
            diff == 0 || diff == 1 || diff == 11
        } else {
            self.number == other.number
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HudSettings {
    pub is_collapsed: bool,
    pub mode: String,
    pub harmonic_filter_enabled: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_camelot_parsing() {
        let key = CamelotKey::parse("8A").expect("8A debe ser valido");
        assert_eq!(key.number, 8);
        assert_eq!(key.letter, 'A');

        let key_12b = CamelotKey::parse("12b").expect("12b debe ser valido en minuscula");
        assert_eq!(key_12b.number, 12);
        assert_eq!(key_12b.letter, 'B');
    }

    #[test]
    fn test_invalid_camelot_parsing() {
        assert!(CamelotKey::parse("13A").is_none());
        assert!(CamelotKey::parse("0B").is_none());
        assert!(CamelotKey::parse("8C").is_none());
        assert!(CamelotKey::parse("").is_none());
    }

    #[test]
    fn test_camelot_compatibility() {
        let key_8a = CamelotKey::parse("8A").unwrap();
        let same = CamelotKey::parse("8A").unwrap();
        let up = CamelotKey::parse("9A").unwrap();
        let down = CamelotKey::parse("7A").unwrap();
        let relative_major = CamelotKey::parse("8B").unwrap();
        let incompatible = CamelotKey::parse("2A").unwrap();

        assert!(key_8a.is_compatible_with(&same));
        assert!(key_8a.is_compatible_with(&up));
        assert!(key_8a.is_compatible_with(&down));
        assert!(key_8a.is_compatible_with(&relative_major));
        assert!(!key_8a.is_compatible_with(&incompatible));
    }

    #[test]
    fn test_camelot_wrap_around_compatibility() {
        let key_12a = CamelotKey::parse("12A").unwrap();
        let key_1a = CamelotKey::parse("1A").unwrap();
        assert!(key_12a.is_compatible_with(&key_1a));
    }
}
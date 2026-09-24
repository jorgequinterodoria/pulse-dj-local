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
    pub location: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HarmonicRelation {
    Exact,         // 8A -> 8A
    RelativeMode,  // 8A -> 8B
    EnergyDown,    // 8A -> 7A
    EnergyUp,      // 8A -> 9A
    EnergyBoost2,  // 8A -> 10A (+2 semitonos / Modulación de subida)
    EnergyBoost7,  // 8A -> 3A (+1 semitono / Modulación de clímax)
    Incompatible,
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

    pub fn relation_with(&self, other: &CamelotKey) -> HarmonicRelation {
        if self.letter == other.letter {
            if self.number == other.number {
                return HarmonicRelation::Exact;
            }

            // Normalización circular del 1 al 12
            let diff_forward = if other.number >= self.number {
                other.number - self.number
            } else {
                other.number + 12 - self.number
            };

            let diff_backward = if self.number >= other.number {
                self.number - other.number
            } else {
                self.number + 12 - other.number
            };

            if diff_forward == 1 {
                return HarmonicRelation::EnergyUp;
            }
            if diff_backward == 1 {
                return HarmonicRelation::EnergyDown;
            }
            if diff_forward == 2 {
                return HarmonicRelation::EnergyBoost2;
            }
            if diff_forward == 7 {
                return HarmonicRelation::EnergyBoost7;
            }

            HarmonicRelation::Incompatible
        } else if self.number == other.number {
            HarmonicRelation::RelativeMode
        } else {
            HarmonicRelation::Incompatible
        }
    }

    pub fn is_mix_compatible(&self, other: &CamelotKey) -> bool {
        let relation = self.relation_with(other);
        relation != HarmonicRelation::Incompatible
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterCriteria {
    pub key: String,
    pub bpm: f64,
    pub bpm_tolerance_percent: f64, // Ej: 4.0 para +-4%
    pub allow_half_double_time: bool,
    pub strict_harmonic: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_camelot_relations() {
        let current = CamelotKey::parse("8A").unwrap();

        assert_eq!(current.relation_with(&CamelotKey::parse("8A").unwrap()), HarmonicRelation::Exact);
        assert_eq!(current.relation_with(&CamelotKey::parse("8B").unwrap()), HarmonicRelation::RelativeMode);
        assert_eq!(current.relation_with(&CamelotKey::parse("9A").unwrap()), HarmonicRelation::EnergyUp);
        assert_eq!(current.relation_with(&CamelotKey::parse("7A").unwrap()), HarmonicRelation::EnergyDown);
        assert_eq!(current.relation_with(&CamelotKey::parse("10A").unwrap()), HarmonicRelation::EnergyBoost2);
        assert_eq!(current.relation_with(&CamelotKey::parse("3A").unwrap()), HarmonicRelation::EnergyBoost7);
        assert_eq!(current.relation_with(&CamelotKey::parse("1B").unwrap()), HarmonicRelation::Incompatible);
    }

    #[test]
    fn test_camelot_circular_boundaries() {
        let key_12a = CamelotKey::parse("12A").unwrap();
        let key_1a = CamelotKey::parse("1A").unwrap();
        let key_11a = CamelotKey::parse("11A").unwrap();

        assert_eq!(key_12a.relation_with(&key_1a), HarmonicRelation::EnergyUp);
        assert_eq!(key_1a.relation_with(&key_12a), HarmonicRelation::EnergyDown);
        assert_eq!(key_12a.relation_with(&key_11a), HarmonicRelation::EnergyDown);
    }
}
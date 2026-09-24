use crate::models::Track;
use std::sync::Mutex;

pub struct DjWatcherState {
    pub current_track: Mutex<Option<Track>>,
}

impl DjWatcherState {
    pub fn new() -> Self {
        Self {
            current_track: Mutex::new(Some(Track {
                id: "initial_demo_1".to_string(),
                title: "Shine On".to_string(),
                artist: "R.I.O".to_string(),
                bpm: 128.0,
                key: "8A".to_string(),
                energy: 7,
                rating: Some(4),
            })),
        }
    }

    pub fn set_track(&self, track: Track) {
        if let Ok(mut lock) = self.current_track.lock() {
            *lock = Some(track);
        }
    }

    pub fn get_track(&self) -> Option<Track> {
        if let Ok(lock) = self.current_track.lock() {
            lock.clone()
        } else {
            None
        }
    }
}

pub fn get_mock_recommendations() -> Vec<Track> {
    vec![
        Track {
            id: "rec_1".to_string(),
            title: "Pepas".to_string(),
            artist: "Farruko".to_string(),
            bpm: 121.0,
            key: "1B".to_string(),
            energy: 9,
            rating: Some(5),
        },
        Track {
            id: "rec_2".to_string(),
            title: "Rise Up".to_string(),
            artist: "Yves Larock".to_string(),
            bpm: 128.0,
            key: "9A".to_string(),
            energy: 6,
            rating: Some(4),
        },
        Track {
            id: "rec_3".to_string(),
            title: "Moves Like Jagger".to_string(),
            artist: "Maroon 5".to_string(),
            bpm: 128.0,
            key: "10A".to_string(),
            energy: 7,
            rating: Some(4),
        },
        Track {
            id: "rec_4".to_string(),
            title: "Give Me Everything".to_string(),
            artist: "Pitbull".to_string(),
            bpm: 129.0,
            key: "4A".to_string(),
            energy: 8,
            rating: Some(5),
        },
        Track {
            id: "rec_5".to_string(),
            title: "Pump Up The Jam".to_string(),
            artist: "Technotronic".to_string(),
            bpm: 125.0,
            key: "8A".to_string(),
            energy: 8,
            rating: Some(4),
        },
        Track {
            id: "rec_6".to_string(),
            title: "I'm Good (Blue)".to_string(),
            artist: "David Guetta & Bebe Rexha".to_string(),
            bpm: 128.0,
            key: "7A".to_string(),
            energy: 9,
            rating: Some(5),
        },
        Track {
            id: "rec_7".to_string(),
            title: "I Love It".to_string(),
            artist: "Icona Pop".to_string(),
            bpm: 126.0,
            key: "8B".to_string(),
            energy: 8,
            rating: Some(4),
        },
        Track {
            id: "rec_8".to_string(),
            title: "Limbo".to_string(),
            artist: "Daddy Yankee".to_string(),
            bpm: 125.0,
            key: "9B".to_string(),
            energy: 8,
            rating: Some(4),
        },
        Track {
            id: "rec_9".to_string(),
            title: "Love Tonight".to_string(),
            artist: "Shouse".to_string(),
            bpm: 123.0,
            key: "8A".to_string(),
            energy: 7,
            rating: Some(5),
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_watcher_state_flow() {
        let state = DjWatcherState::new();
        let track = state.get_track().expect("Debe existir una pista inicial");
        assert_eq!(track.title, "Shine On");
        assert_eq!(track.artist, "R.I.O");

        state.set_track(Track {
            id: "test_2".to_string(),
            title: "Titanium".to_string(),
            artist: "David Guetta".to_string(),
            bpm: 126.0,
            key: "11A".to_string(),
            energy: 8,
            rating: Some(5),
        });

        let updated = state.get_track().expect("Debe actualizar el track");
        assert_eq!(updated.title, "Titanium");
    }

    #[test]
    fn test_mock_recommendations_count() {
        let recs = get_mock_recommendations();
        assert!(!recs.is_empty());
        assert_eq!(recs[0].title, "Pepas");
    }
}
use crate::models::{CamelotKey, FilterCriteria, HarmonicRelation, Track};
use rusqlite::{params, Connection, Result};
use std::sync::Mutex;

pub struct DatabaseManager {
    conn: Mutex<Connection>,
}

impl DatabaseManager {
    pub fn new_in_memory() -> Result<Self> {
        let data_dir = dirs::audio_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
        let pulse_dir = data_dir.join("PulseDJ");
        if !pulse_dir.exists() {
            std::fs::create_dir_all(&pulse_dir).unwrap();
        }
        let db_path = pulse_dir.join("library.sqlite");
        
        let conn = Connection::open(db_path)?;
        let manager = Self {
            conn: Mutex::new(conn),
        };
        manager.init_schema()?;
        Ok(manager)
    }

    pub fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tracks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                bpm REAL NOT NULL,
                key TEXT NOT NULL,
                energy INTEGER NOT NULL,
                rating INTEGER
            )",
            [],
        )?;

        // Migración silenciosa: Intenta añadir la columna 'location' a bases de datos existentes
        let _ = conn.execute("ALTER TABLE tracks ADD COLUMN location TEXT NOT NULL DEFAULT ''", []);

        conn.execute(
            "CREATE TABLE IF NOT EXISTS transitions (
                track_a_id TEXT NOT NULL,
                track_b_id TEXT NOT NULL,
                play_count INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (track_a_id, track_b_id),
                FOREIGN KEY (track_a_id) REFERENCES tracks(id),
                FOREIGN KEY (track_b_id) REFERENCES tracks(id)
            )",
            [],
        )?;
        Ok(())
    }

    pub fn upsert_track(&self, track: &Track) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        // Si el track nuevo no trae location, conservamos el location que ya estaba en la BD
        conn.execute(
            "INSERT INTO tracks (id, title, artist, bpm, key, energy, rating, location) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET 
                title=excluded.title, 
                artist=excluded.artist, 
                bpm=excluded.bpm, 
                key=excluded.key,
                location=CASE WHEN excluded.location != '' THEN excluded.location ELSE location END",
            params![
                track.id, track.title, track.artist, track.bpm, track.key, track.energy, track.rating, track.location
            ],
        )?;
        Ok(())
    }

    pub fn get_compatible_tracks(&self, criteria: &FilterCriteria) -> Result<Vec<Track>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, title, artist, bpm, key, energy, rating, location FROM tracks")?;

        let track_iter = stmt.query_map([], |row| {
            Ok(Track {
                id: row.get(0)?,
                title: row.get(1)?,
                artist: row.get(2)?,
                bpm: row.get(3)?,
                key: row.get(4)?,
                energy: row.get(5)?,
                rating: row.get(6)?,
                location: row.get(7)?, // Recuperamos la ruta
            })
        })?;

        let current_camelot = CamelotKey::parse(&criteria.key);
        let mut filtered: Vec<Track> = Vec::new();

        for track in track_iter.flatten() {
            if track.key == criteria.key && (track.bpm - criteria.bpm).abs() < 0.1 {
               continue; 
            }

            if criteria.strict_harmonic {
                if let (Some(cur), Some(candidate)) = (&current_camelot, CamelotKey::parse(&track.key)) {
                    if !cur.is_mix_compatible(&candidate) {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            let bpm_min = criteria.bpm * (1.0 - (criteria.bpm_tolerance_percent / 100.0));
            let bpm_max = criteria.bpm * (1.0 + (criteria.bpm_tolerance_percent / 100.0));

            let bpm_matches_standard = track.bpm >= bpm_min && track.bpm <= bpm_max;
            let bpm_matches_half = criteria.allow_half_double_time
                && (track.bpm >= (bpm_min / 2.0) && track.bpm <= (bpm_max / 2.0));
            let bpm_matches_double = criteria.allow_half_double_time
                && (track.bpm >= (bpm_min * 2.0) && track.bpm <= (bpm_max * 2.0));

            if bpm_matches_standard || bpm_matches_half || bpm_matches_double {
                filtered.push(track);
            }
        }

        filtered.sort_by(|a, b| {
            let rel_a = current_camelot
                .as_ref()
                .and_then(|c| CamelotKey::parse(&a.key).map(|k| c.relation_with(&k)))
                .unwrap_or(HarmonicRelation::Incompatible);

            let rel_b = current_camelot
                .as_ref()
                .and_then(|c| CamelotKey::parse(&b.key).map(|k| c.relation_with(&k)))
                .unwrap_or(HarmonicRelation::Incompatible);

            let rank = |rel: HarmonicRelation| match rel {
                HarmonicRelation::Exact => 1,
                HarmonicRelation::RelativeMode => 2,
                HarmonicRelation::EnergyUp => 3,
                HarmonicRelation::EnergyDown => 4,
                HarmonicRelation::EnergyBoost2 => 5,
                HarmonicRelation::EnergyBoost7 => 6,
                HarmonicRelation::Incompatible => 7,
            };

            let rank_cmp = rank(rel_a).cmp(&rank(rel_b));
            if rank_cmp != std::cmp::Ordering::Equal {
                rank_cmp
            } else {
                let diff_a = (a.bpm - criteria.bpm).abs();
                let diff_b = (b.bpm - criteria.bpm).abs();
                diff_a.partial_cmp(&diff_b).unwrap_or(std::cmp::Ordering::Equal)
            }
        });

        filtered.truncate(10);
        Ok(filtered)
    }

    pub fn get_my_style_tracks(&self, current_track_id: &str) -> Result<Vec<Track>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT t.id, t.title, t.artist, t.bpm, t.key, t.energy, t.rating, t.location
             FROM tracks t
             JOIN transitions tr ON t.id = tr.track_b_id
             WHERE tr.track_a_id = ?1
             ORDER BY tr.play_count DESC
             LIMIT 10"
        )?;

        let track_iter = stmt.query_map(params![current_track_id], |row| {
            Ok(Track {
                id: row.get(0)?,
                title: row.get(1)?,
                artist: row.get(2)?,
                bpm: row.get(3)?,
                key: row.get(4)?,
                energy: row.get(5)?,
                rating: row.get(6)?,
                location: row.get(7)?,
            })
        })?;

        let mut tracks = Vec::new();
        for t in track_iter.flatten() {
            tracks.push(t);
        }

        Ok(tracks)
    }

    pub fn record_transition(&self, track_a_id: &str, track_b_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO transitions (track_a_id, track_b_id, play_count)
             VALUES (?1, ?2, 1)
             ON CONFLICT(track_a_id, track_b_id)
             DO UPDATE SET play_count = play_count + 1",
            params![track_a_id, track_b_id],
        )?;
        Ok(())
    }
}
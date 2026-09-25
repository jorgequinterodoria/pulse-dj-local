use rusqlite::{params, params_from_iter, Connection, Result};
use std::sync::Mutex;
use crate::models::Track;

pub struct DatabaseManager {
    pub conn: Mutex<Connection>,
}

impl DatabaseManager {
    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tracks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                bpm REAL NOT NULL,
                key TEXT NOT NULL,
                energy INTEGER NOT NULL,
                rating INTEGER,
                location TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS transitions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_track_id TEXT NOT NULL,
                to_track_id TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn upsert_track(&self, track: &Track) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO tracks (id, title, artist, bpm, key, energy, rating, location)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                track.id,
                track.title,
                track.artist,
                track.bpm,
                track.key,
                track.energy,
                track.rating,
                track.location
            ],
        )?;
        Ok(())
    }

    pub fn record_transition(&self, from_id: &str, to_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO transitions (from_track_id, to_track_id) VALUES (?1, ?2)",
            params![from_id, to_id],
        )?;
        Ok(())
    }

    // ==========================================
    // MOTOR DE BÚSQUEDA DINÁMICO (FILTROS)
    // ==========================================
    pub fn get_filtered_tracks(
        &self,
        min_bpm: f64,
        max_bpm: f64,
        allowed_keys: Vec<String>,
        randomize: bool,
        fresh: bool,
    ) -> Result<Vec<Track>> {
        let conn = self.conn.lock().unwrap();

        let mut query = String::from(
            "SELECT id, title, artist, bpm, key, energy, rating, location FROM tracks WHERE bpm >= ? AND bpm <= ?"
        );
        
        // Inyección dinámica de Array para la Rueda de Camelot
        if !allowed_keys.is_empty() {
            let placeholders = allowed_keys.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
            query.push_str(&format!(" AND key IN ({})", placeholders));
        }
        
        // Lógica de ordenamiento
        if fresh {
            query.push_str(" ORDER BY id DESC LIMIT 50"); 
        } else if randomize {
            query.push_str(" ORDER BY RANDOM() LIMIT 50");
        } else {
            query.push_str(" ORDER BY rating DESC, bpm ASC LIMIT 50");
        }

        let mut stmt = conn.prepare(&query)?;
        
        // Mapeo seguro de variables SQL
        let mut sql_params: Vec<rusqlite::types::Value> = vec![min_bpm.into(), max_bpm.into()];
        for k in allowed_keys {
            sql_params.push(k.into());
        }

        let track_iter = stmt.query_map(params_from_iter(sql_params), |row| {
            Ok(Track {
                id: row.get(0)?,
                title: row.get(1)?,
                artist: row.get(2)?,
                bpm: row.get(3)?,
                key: row.get(4)?,
                energy: row.get(5)?,
                rating: row.get(6)?,
                location: row.get(7).unwrap_or_default(),
            })
        })?;

        let mut tracks = Vec::new();
        for t in track_iter {
            tracks.push(t?);
        }
        
        Ok(tracks)
    }
}
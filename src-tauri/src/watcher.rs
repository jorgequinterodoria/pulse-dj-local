use rusqlite::{types::Value, Connection};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::db::DatabaseManager;
use crate::models::Track;

pub struct DjWatcherState {
    pub last_processed_id: Mutex<String>,
    pub current_track: Mutex<Option<Track>>,
}

impl DjWatcherState {
    pub fn new() -> Self {
        Self {
            last_processed_id: Mutex::new(String::new()),
            current_track: Mutex::new(None),
        }
    }
    pub fn get_track(&self) -> Option<Track> {
        self.current_track.lock().unwrap().clone()
    }
    pub fn set_track(&self, track: Track) {
        *self.current_track.lock().unwrap() = Some(track);
    }
}

fn get_camelot_key(index: Option<i64>) -> String {
    match index {
        Some(0) => "8B", Some(1) => "5A", Some(2) => "3B", Some(3) => "12A",
        Some(4) => "10B", Some(5) => "7A", Some(6) => "5B", Some(7) => "2A",
        Some(8) => "12B", Some(9) => "9A", Some(10) => "7B", Some(11) => "4A",
        Some(12) => "2B", Some(13) => "11A", Some(14) => "9B", Some(15) => "6A",
        Some(16) => "4B", Some(17) => "1A", Some(18) => "11B", Some(19) => "8A",
        Some(20) => "6B", Some(21) => "3A", Some(22) => "1B", Some(23) => "10A",
        _ => "8A",
    }
    .to_string()
}

pub fn start_fs_watcher(app_handle: AppHandle, state: Arc<DjWatcherState>, db: Arc<DatabaseManager>) {
    std::thread::spawn(move || {
        let djay_db_path = dirs::audio_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("djay/djay Media Library.djayMediaLibrary/MediaLibrary.db");

        if !djay_db_path.exists() { return; }

        if let Ok(conn) = Connection::open(&djay_db_path) {
            let _ = conn.busy_timeout(Duration::from_secs(5));
            
            // CORRECCIÓN SQL: 'i.' (MediaItemIndex/User Edit) toma prioridad absoluta
            if let Ok(mut stmt) = conn.prepare("
                SELECT f.docid, f.c0title, f.c1artist,
                       COALESCE(i.bpm, a.bpm) as bpm,
                       COALESCE(i.musicalKeySignatureIndex, a.keySignatureIndex) as keyIndex
                FROM fts_searchIndex_content f
                LEFT JOIN secondaryIndex_mediaItemAnalyzedDataIndex a ON f.docid = a.rowid
                LEFT JOIN secondaryIndex_mediaItemIndex i ON f.docid = i.rowid
            ") {
                let _ = stmt.query_map([], |row| {
                    let id_val = row.get::<usize, Value>(0).unwrap_or(Value::Null);
                    let id = match id_val {
                        Value::Integer(i) => i.to_string(),
                        Value::Text(t) => t,
                        _ => return Ok(()),
                    };

                    let title = match row.get::<usize, Value>(1).unwrap_or(Value::Null) {
                        Value::Text(t) => t, _ => return Ok(()),
                    };
                    let artist = match row.get::<usize, Value>(2).unwrap_or(Value::Null) {
                        Value::Text(t) => t, _ => return Ok(()),
                    };

                    let title_trim = title.trim();
                    let artist_trim = artist.trim();
                    if title_trim.is_empty() || artist_trim.is_empty() { return Ok(()); }

                    let raw_bpm = match row.get::<usize, Value>(3).unwrap_or(Value::Null) {
                        Value::Real(f) => f, Value::Integer(i) => i as f64,
                        Value::Text(t) => t.parse::<f64>().unwrap_or(126.0), _ => 126.0,
                    };
                    let bpm = (raw_bpm * 10.0).round() / 10.0;
                    
                    let key_idx = match row.get::<usize, Value>(4).unwrap_or(Value::Null) {
                        Value::Integer(i) => Some(i), _ => None,
                    };

                    let track = Track {
                        id, title: title_trim.to_string(), artist: artist_trim.to_string(),
                        bpm, key: get_camelot_key(key_idx), energy: 7, rating: Some(5), location: String::new(),
                    };
                    let _ = db.upsert_track(&track);
                    Ok(())
                }).map(|iter| { for _ in iter {} });
            }
        }

        loop {
            std::thread::sleep(Duration::from_millis(1000));
            let conn = match Connection::open(&djay_db_path) { Ok(c) => c, Err(_) => continue, };
            let _ = conn.busy_timeout(Duration::from_secs(5));

            let mut stmt_db2 = match conn.prepare("SELECT data, metadata FROM database2 ORDER BY rowid DESC LIMIT 15") { Ok(s) => s, Err(_) => continue, };
            let mut recent_rows: Vec<String> = Vec::new();
            let _ = stmt_db2.query_map([], |row| {
                let mut row_text = String::new();
                if let Ok(Some(d)) = row.get::<usize, Option<Vec<u8>>>(0) { row_text.push_str(&String::from_utf8_lossy(&d)); }
                if let Ok(Some(m)) = row.get::<usize, Option<Vec<u8>>>(1) { row_text.push_str(&String::from_utf8_lossy(&m)); }
                recent_rows.push(row_text);
                Ok(())
            }).map(|iter| { for _ in iter {} });

            if recent_rows.is_empty() { continue; }

            let mut stmt_search = match conn.prepare("
                SELECT f.docid, f.c0title, f.c1artist,
                       COALESCE(i.bpm, a.bpm) as bpm,
                       COALESCE(i.musicalKeySignatureIndex, a.keySignatureIndex) as keyIndex
                FROM fts_searchIndex_content f
                LEFT JOIN secondaryIndex_mediaItemAnalyzedDataIndex a ON f.docid = a.rowid
                LEFT JOIN secondaryIndex_mediaItemIndex i ON f.docid = i.rowid
            ") { Ok(s) => s, Err(_) => continue, };

            let mut library = Vec::new();
            let _ = stmt_search.query_map([], |row| {
                let title = match row.get::<usize, Value>(1).unwrap_or(Value::Null) { Value::Text(t) => t, _ => return Ok(()), };
                let artist = match row.get::<usize, Value>(2).unwrap_or(Value::Null) { Value::Text(t) => t, _ => return Ok(()), };
                let title_trim = title.trim(); let artist_trim = artist.trim();

                if title_trim.len() > 2 && artist_trim.len() > 2 {
                    let id_val = row.get::<usize, Value>(0).unwrap_or(Value::Null);
                    let id = match id_val { Value::Integer(i) => i.to_string(), Value::Text(t) => t, _ => return Ok(()), };
                    let raw_bpm = match row.get::<usize, Value>(3).unwrap_or(Value::Null) { Value::Real(f) => f, Value::Integer(i) => i as f64, Value::Text(t) => t.parse::<f64>().unwrap_or(126.0), _ => 126.0, };
                    let bpm = (raw_bpm * 10.0).round() / 10.0;
                    let key_idx = match row.get::<usize, Value>(4).unwrap_or(Value::Null) { Value::Integer(i) => Some(i), _ => None, };

                    library.push(Track { id, title: title_trim.to_string(), artist: artist_trim.to_string(), bpm, key: get_camelot_key(key_idx), energy: 7, rating: Some(5), location: String::new() });
                }
                Ok(())
            }).map(|iter| { for _ in iter {} });

            let mut best_match = None;
            for row_text in recent_rows {
                if row_text.len() < 10 { continue; }
                let mut matches = Vec::new();
                for track in &library {
                    if row_text.contains(&track.title) && row_text.contains(&track.artist) { matches.push(track.clone()); }
                }
                if !matches.is_empty() {
                    matches.sort_by(|a, b| b.title.len().cmp(&a.title.len()));
                    best_match = Some(matches[0].clone());
                    break;
                }
            }

            if let Some(new_track) = best_match {
                let mut last_id = state.last_processed_id.lock().unwrap();
                if *last_id != new_track.id {
                    let _ = db.upsert_track(&new_track);
                    *last_id = new_track.id.clone();
                    state.set_track(new_track.clone());
                    let _ = app_handle.emit("track-changed", new_track);
                }
            }
        }
    });
}
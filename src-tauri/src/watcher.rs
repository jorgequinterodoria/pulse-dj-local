use rusqlite::{types::Value, Connection, OpenFlags};
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

pub fn start_fs_watcher(
    app_handle: AppHandle,
    state: Arc<DjWatcherState>,
    db: Arc<DatabaseManager>,
) {
    std::thread::spawn(move || {
        let djay_db_path = dirs::audio_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("djay/djay Media Library.djayMediaLibrary/MediaLibrary.db");

        if !djay_db_path.exists() {
            println!("❌ No se encontró la base de datos de djay Pro en {:?}", djay_db_path);
            return;
        }

        // ==========================================
        // FASE 1: IMPORTADOR MASIVO SILENCIOSO
        // ==========================================
        println!("🔄 [1/2] Iniciando sincronización masiva de la biblioteca...");
        
        if let Ok(conn) = Connection::open_with_flags(&djay_db_path, OpenFlags::SQLITE_OPEN_READ_ONLY) {
            let _ = conn.busy_timeout(Duration::from_secs(5));
            if let Ok(mut stmt) = conn.prepare("
                SELECT f.docid, f.c0title, f.c1artist,
                       COALESCE(a.bpm, i.bpm) as bpm,
                       COALESCE(a.keySignatureIndex, i.musicalKeySignatureIndex) as keyIndex,
                       i.*
                FROM fts_searchIndex_content f
                LEFT JOIN secondaryIndex_mediaItemAnalyzedDataIndex a ON f.docid = a.rowid
                LEFT JOIN secondaryIndex_mediaItemIndex i ON f.docid = i.rowid
            ") {
                let mut count = 0;
                let _ = stmt.query_map([], |row| {
                    let id_val = row.get::<usize, Value>(0).unwrap_or(Value::Null);
                    let id = match id_val {
                        Value::Integer(i) => i.to_string(),
                        Value::Text(t) => t,
                        _ => return Ok(()),
                    };

                    let title = match row.get::<usize, Value>(1).unwrap_or(Value::Null) {
                        Value::Text(t) => t,
                        _ => return Ok(()),
                    };
                    
                    let artist = match row.get::<usize, Value>(2).unwrap_or(Value::Null) {
                        Value::Text(t) => t,
                        _ => return Ok(()),
                    };

                    if title.trim().is_empty() || artist.trim().is_empty() {
                        return Ok(());
                    }

                    let bpm = match row.get::<usize, Value>(3).unwrap_or(Value::Null) {
                        Value::Real(f) => f,
                        Value::Integer(i) => i as f64,
                        Value::Text(t) => t.parse::<f64>().unwrap_or(126.0),
                        _ => 126.0,
                    };

                    let key_idx = match row.get::<usize, Value>(4).unwrap_or(Value::Null) {
                        Value::Integer(i) => Some(i),
                        _ => None,
                    };

                    let mut location = String::new();
                    let col_count = row.as_ref().column_count();
                    for i in 5..col_count {
                        if let Ok(Value::Text(val)) = row.get::<usize, Value>(i) {
                            if val.starts_with("file://") || val.starts_with("/Users/") || (val.contains('/') && (val.to_lowercase().ends_with(".mp3") || val.to_lowercase().ends_with(".m4a") || val.to_lowercase().ends_with(".wav"))) {
                                location = val;
                                break;
                            }
                        }
                    }

                    let track = Track {
                        id,
                        title: title.trim().to_string(),
                        artist: artist.trim().to_string(),
                        bpm,
                        key: get_camelot_key(key_idx),
                        energy: 7,
                        rating: Some(5),
                        location,
                    };

                    let _ = db.upsert_track(&track);
                    count += 1;
                    Ok(())
                }).map(|iter| {
                    for _ in iter {}
                });
                println!("🎉 [1/2] Importación completada: {} canciones sincronizadas nativamente.", count);
            }
        }

        println!("🎧 [2/2] Iniciando Pulse DJ Bridge (Motor 100% Rust / Lectura en Vivo)...");

        // ==========================================
        // FASE 2: POLLING EN VIVO (SIN BLOQUEOS)
        // ==========================================
        loop {
            std::thread::sleep(Duration::from_millis(1000));

            let conn = match Connection::open_with_flags(&djay_db_path, OpenFlags::SQLITE_OPEN_READ_ONLY) {
                Ok(c) => c,
                Err(_) => continue,
            };
            let _ = conn.busy_timeout(Duration::from_secs(5));

            // 1. Extraer las últimas 15 lecturas de forma separada (NO fusionadas)
            let mut stmt_db2 = match conn.prepare("SELECT data, metadata FROM database2 ORDER BY rowid DESC LIMIT 15") {
                Ok(s) => s,
                Err(_) => continue,
            };

            let mut db2_strings = Vec::new();
            let _ = stmt_db2.query_map([], |row| {
                let data: Option<Vec<u8>> = row.get(0).unwrap_or(None);
                let metadata: Option<Vec<u8>> = row.get(1).unwrap_or(None);
                
                let mut row_text = String::new();
                if let Some(d) = data { row_text.push_str(&String::from_utf8_lossy(&d)); }
                if let Some(m) = metadata { row_text.push_str(&String::from_utf8_lossy(&m)); }
                Ok(row_text)
            }).map(|iter| {
                for text_res in iter {
                    if let Ok(text) = text_res {
                        if text.len() >= 10 {
                            db2_strings.push(text);
                        }
                    }
                }
            });

            if db2_strings.is_empty() { continue; }

            // Creamos un vector de vectores (Buckets) para agrupar los matches dependiendo de qué tan recientes sean
            let mut matches_per_row: Vec<Vec<Track>> = vec![Vec::new(); db2_strings.len()];

            let mut stmt_search = match conn.prepare("
                SELECT f.docid, f.c0title, f.c1artist,
                       COALESCE(a.bpm, i.bpm) as bpm,
                       COALESCE(a.keySignatureIndex, i.musicalKeySignatureIndex) as keyIndex,
                       i.*
                FROM fts_searchIndex_content f
                LEFT JOIN secondaryIndex_mediaItemAnalyzedDataIndex a ON f.docid = a.rowid
                LEFT JOIN secondaryIndex_mediaItemIndex i ON f.docid = i.rowid
            ") {
                Ok(s) => s,
                Err(_) => continue,
            };

            let _ = stmt_search.query_map([], |row| {
                let title_val = row.get::<usize, Value>(1).unwrap_or(Value::Null);
                let artist_val = row.get::<usize, Value>(2).unwrap_or(Value::Null);

                if let (Value::Text(title), Value::Text(artist)) = (title_val, artist_val) {
                    let title_trim = title.trim();
                    let artist_trim = artist.trim();

                    if title_trim.len() > 2 && artist_trim.len() > 2 {
                        
                        // Revisamos cada string del historial, empezando por el más nuevo (índice 0)
                        for (i, row_text) in db2_strings.iter().enumerate() {
                            if row_text.contains(title_trim) && row_text.contains(artist_trim) {
                                
                                let id_val = row.get::<usize, Value>(0).unwrap_or(Value::Null);
                                let id = match id_val {
                                    Value::Integer(v) => v.to_string(),
                                    Value::Text(t) => t,
                                    _ => continue,
                                };
                                
                                let bpm = match row.get::<usize, Value>(3).unwrap_or(Value::Null) {
                                    Value::Real(f) => f,
                                    Value::Integer(v) => v as f64,
                                    Value::Text(t) => t.parse::<f64>().unwrap_or(126.0),
                                    _ => 126.0,
                                };

                                let key_idx = match row.get::<usize, Value>(4).unwrap_or(Value::Null) {
                                    Value::Integer(v) => Some(v),
                                    _ => None,
                                };

                                let mut location = String::new();
                                let col_count = row.as_ref().column_count();
                                for col_i in 5..col_count {
                                    if let Ok(Value::Text(val)) = row.get::<usize, Value>(col_i) {
                                        if val.starts_with("file://") || val.starts_with("/Users/") || (val.contains('/') && (val.to_lowercase().ends_with(".mp3") || val.to_lowercase().ends_with(".m4a") || val.to_lowercase().ends_with(".wav"))) {
                                            location = val;
                                            break;
                                        }
                                    }
                                }

                                // Agregamos la canción al bucket correspondiente (0 es el más reciente)
                                matches_per_row[i].push(Track {
                                    id,
                                    title: title_trim.to_string(),
                                    artist: artist_trim.to_string(),
                                    bpm,
                                    key: get_camelot_key(key_idx),
                                    energy: 7,
                                    rating: Some(5),
                                    location,
                                });
                            }
                        }
                    }
                }
                Ok(())
            }).map(|iter| {
                for _ in iter {}
            });

            // Escogemos la pista del historial MÁS RECIENTE
            let mut best_match: Option<Track> = None;
            for mut matches in matches_per_row {
                if !matches.is_empty() {
                    // Si en ese mismo instante sonaron 2 parecidas, priorizamos el título más largo (Remix vs Original)
                    matches.sort_by(|a, b| b.title.len().cmp(&a.title.len()));
                    best_match = Some(matches[0].clone());
                    break; // Rompemos el bucle, ignoramos las canciones viejas
                }
            }

            // Emitir evento si cambió la canción
            if let Some(new_track) = best_match {
                let mut last_id = state.last_processed_id.lock().unwrap();
                if *last_id != new_track.id {
                    let _ = db.upsert_track(&new_track);
                    
                    if let Some(prev_track) = state.get_track() {
                        let _ = db.record_transition(&prev_track.id, &new_track.id);
                    }

                    *last_id = new_track.id.clone();
                    state.set_track(new_track.clone());

                    println!("🎵 En vivo: {} - {} [{} | {} BPM]", new_track.title, new_track.artist, new_track.key, new_track.bpm);

                    let _ = app_handle.emit("track-changed", new_track);
                }
            }
        }
    });
}
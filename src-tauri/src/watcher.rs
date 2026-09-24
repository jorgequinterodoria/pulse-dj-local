use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, mpsc::channel, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::db::DatabaseManager;
use crate::models::Track;

pub struct DjWatcherState {
    pub last_processed_id: Mutex<String>,
    pub current_track: Mutex<Option<Track>>,
}

impl DjWatcherState {
    // Restaurado el método new() que lib.rs estaba buscando
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

// Restaurada la firma original que acepta 3 argumentos
pub fn start_fs_watcher(
    app_handle: AppHandle,
    state: Arc<DjWatcherState>,
    db: Arc<DatabaseManager>,
) {
    std::thread::spawn(move || {
        let (tx, rx) = channel();

        let mut watcher = RecommendedWatcher::new(
            tx,
            Config::default().with_poll_interval(Duration::from_millis(300)),
        )
        .unwrap();

        let target_dir = dirs::audio_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("PulseDJ");
            
        let target_file = target_dir.join("now_playing.json");

        if !target_dir.exists() {
            let _ = fs::create_dir_all(&target_dir);
        }
        
        if !target_file.exists() {
            let _ = fs::write(&target_file, "{}");
        }

        watcher
            .watch(&target_dir, RecursiveMode::NonRecursive)
            .unwrap();

        println!("👀 Monitoreando pistas en: {:?}", target_file);

        for res in rx {
            match res {
                Ok(event) => {
                    if let EventKind::Modify(_) = event.kind {
                        
                        if let Ok(content) = fs::read_to_string(&target_file) {
                            if let Ok(new_track) = serde_json::from_str::<Track>(&content) {
                                
                                let mut last_id = state.last_processed_id.lock().unwrap();
                                
                                if *last_id != new_track.id {
                                    
                                    // Guardar en la base de datos
                                    let _ = db.upsert_track(&new_track);
                                    
                                    if let Some(prev_track) = state.get_track() {
                                        let _ = db.record_transition(&prev_track.id, &new_track.id);
                                    }

                                    *last_id = new_track.id.clone();
                                    state.set_track(new_track.clone());

                                    // Emitir el evento a React
                                    let _ = app_handle.emit("track-changed", new_track);
                                }
                            }
                        }
                    }
                }
                Err(e) => println!("❌ Error en el File System Watcher: {:?}", e),
            }
        }
    });
}
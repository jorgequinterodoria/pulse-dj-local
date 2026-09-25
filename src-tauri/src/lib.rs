use std::sync::Arc;
use tauri::Manager;

pub mod db;
pub mod models;
pub mod watcher;

use crate::db::DatabaseManager;
use crate::models::Track;
use crate::watcher::{start_fs_watcher, DjWatcherState};

// ==========================================
// COMANDOS DE TAURI (Puente React -> Rust)
// ==========================================

#[tauri::command]
fn get_filtered_tracks(
    min_bpm: f64,
    max_bpm: f64,
    allowed_keys: Vec<String>,
    randomize: bool,
    fresh: bool,
    db: tauri::State<Arc<DatabaseManager>>,
) -> Result<Vec<Track>, String> {
    db.get_filtered_tracks(min_bpm, max_bpm, allowed_keys, randomize, fresh)
        .map_err(|e| e.to_string())
}

// ==========================================
// PUNTO DE ENTRADA PRINCIPAL
// ==========================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = match DatabaseManager::new_in_memory() {
        Ok(manager) => Arc::new(manager),
        Err(e) => panic!("Error inicializando la base de datos: {}", e),
    };

    let watcher_state = Arc::new(DjWatcherState::new());

    tauri::Builder::default()
        // Inyectamos el comando aquí
        .invoke_handler(tauri::generate_handler![get_filtered_tracks])
        .setup(move |app| {
            let handle = app.handle().clone();
            
            app.manage(Arc::clone(&watcher_state));
            app.manage(Arc::clone(&db));

            start_fs_watcher(handle, watcher_state, db);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
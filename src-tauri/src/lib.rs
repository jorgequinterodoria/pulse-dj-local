use std::sync::Arc;
use tauri::Manager;

pub mod db;
pub mod models;
pub mod watcher;

use crate::db::DatabaseManager;
use crate::models::Track;
use crate::watcher::{start_fs_watcher, DjWatcherState};

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

#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    tauri::WebviewWindowBuilder::new(
        &app,
        "settings",
        tauri::WebviewUrl::App(Default::default())
    )
    .title("Pulse DJ Settings")
    .inner_size(1000.0, 750.0) // <-- TAMAÑO AUMENTADO
    .min_inner_size(850.0, 600.0)
    .center()
    .decorations(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = match DatabaseManager::new_in_memory() {
        Ok(manager) => Arc::new(manager),
        Err(e) => panic!("Error inicializando la base de datos: {}", e),
    };

    let watcher_state = Arc::new(DjWatcherState::new());

    tauri::Builder::default()
        // Inicializamos el plugin de diálogos para las carpetas
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_filtered_tracks,
            open_settings_window
        ])
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
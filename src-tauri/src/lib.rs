pub mod db;
pub mod models;
pub mod watcher;

use db::DatabaseManager;
use models::{FilterCriteria, Track};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};
use watcher::{start_fs_watcher, DjWatcherState};

pub struct AppState {
    pub watcher: Arc<DjWatcherState>,
    pub db: Arc<DatabaseManager>,
}

#[tauri::command]
fn get_current_track(state: State<'_, AppState>) -> Option<Track> {
    state.watcher.get_track()
}

#[tauri::command]
fn get_compatible_recommendations(
    state: State<'_, AppState>,
    criteria: FilterCriteria,
) -> Result<Vec<Track>, String> {
    state
        .db
        .get_compatible_tracks(&criteria)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_my_style_recommendations(
    state: State<'_, AppState>,
    current_track_id: String,
) -> Result<Vec<Track>, String> {
    state
        .db
        .get_my_style_tracks(&current_track_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn record_dj_transition(
    state: State<'_, AppState>,
    from_id: String,
    to_id: String,
) -> Result<(), String> {
    state
        .db
        .record_transition(&from_id, &to_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn simulate_track_change(state: State<'_, AppState>, new_track: Track) -> Result<(), String> {
    state.watcher.set_track(new_track.clone());
    Ok(())
}

#[tauri::command]
fn set_hud_collapsed(app: AppHandle, collapsed: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if collapsed {
            window
                .set_size(tauri::LogicalSize::new(76.0, 76.0))
                .map_err(|e| e.to_string())?;
        } else {
            window
                .set_size(tauri::LogicalSize::new(340.0, 580.0))
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Arc::new(DatabaseManager::new_in_memory().expect("Error inicializando base SQLite"));
    let watcher_state = Arc::new(DjWatcherState::new());

    tauri::Builder::default()
        .manage(AppState {
            watcher: watcher_state.clone(),
            db: db.clone(),
        })
        .setup(move |app| {
            // Iniciar el demonio observador de archivos
            let handle = app.handle().clone();
            start_fs_watcher(handle, watcher_state, db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_current_track,
            get_compatible_recommendations,
            get_my_style_recommendations,
            record_dj_transition,
            simulate_track_change,
            set_hud_collapsed
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri application");
}
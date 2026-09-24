pub mod models;
pub mod watcher;

use models::Track;
use tauri::{AppHandle, Manager, State};
use watcher::{get_mock_recommendations, DjWatcherState};

#[tauri::command]
fn get_current_track(state: State<'_, DjWatcherState>) -> Option<Track> {
    state.get_track()
}

#[tauri::command]
fn get_recommendations() -> Vec<Track> {
    get_mock_recommendations()
}

#[tauri::command]
fn simulate_track_change(state: State<'_, DjWatcherState>, new_track: Track) -> Result<(), String> {
    state.set_track(new_track);
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
    tauri::Builder::default()
        .manage(DjWatcherState::new())
        .invoke_handler(tauri::generate_handler![
            get_current_track,
            get_recommendations,
            simulate_track_change,
            set_hud_collapsed
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri application");
}
// Evita que se abra una ventana de consola adicional en Windows durante el release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Delega toda la inicialización y los comandos a lib.rs
    pulse_dj_local_lib::run();
}

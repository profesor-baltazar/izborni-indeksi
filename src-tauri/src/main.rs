// Sprječava dodatni konzolni prozor na Windowsu u release verziji.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    izborni_indeksi_lib::run()
}

use base64::Engine;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri_plugin_dialog::DialogExt;

/// Jezik poruka iz Rust dijela (greške). Postavlja ga interfejs.
static ENGLISH: AtomicBool = AtomicBool::new(false);

fn tr(me: &str, en: &str) -> String {
    if ENGLISH.load(Ordering::Relaxed) { en.to_string() } else { me.to_string() }
}

#[tauri::command]
fn set_lang(lang: String) {
    ENGLISH.store(lang == "en", Ordering::Relaxed);
}

/// Snima fajl: korisnik bira lokaciju u standardnom "Sačuvaj kao" dijalogu.
#[tauri::command]
async fn save_file(app: tauri::AppHandle, name: String, data_b64: String) -> Result<Option<String>, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data_b64)
        .map_err(|e| e.to_string())?;
    let picked = tauri::async_runtime::spawn_blocking(move || {
        app.dialog().file().set_file_name(&name).blocking_save_file()
    })
    .await
    .map_err(|e| e.to_string())?;
    let Some(fp) = picked else { return Ok(None) };
    let path = fp.into_path().map_err(|e| e.to_string())?;
    std::fs::write(&path, bytes).map_err(|e| format!("{}: {e}", tr("Ne mogu da sačuvam fajl", "Cannot save the file")))?;
    Ok(Some(path.display().to_string()))
}

/// Akcentna boja izabrana u Windows podešavanjima (Personalizacija → Boje), kao "#rrggbb".
/// Na drugim sistemima vraća None, pa interfejs koristi podrazumijevanu boju.
#[tauri::command]
fn system_accent() -> Option<String> {
    #[cfg(windows)]
    {
        use winreg::{enums::HKEY_CURRENT_USER, RegKey};
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let read = |path: &str, name: &str| -> Option<u32> { hkcu.open_subkey(path).ok()?.get_value(name).ok() };
        // Vrijednost je zapisana kao 0xAABBGGRR
        let v = read(r"Software\Microsoft\Windows\CurrentVersion\Explorer\Accent", "AccentColorMenu")
            .or_else(|| read(r"Software\Microsoft\Windows\DWM", "AccentColor"))?;
        let (r, g, b) = (v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff);
        return Some(format!("#{r:02x}{g:02x}{b:02x}"));
    }
    #[allow(unreachable_code)]
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save_file,
            system_accent,
            set_lang
        ])
        .run(tauri::generate_context!())
        .expect("greška pri pokretanju aplikacije");
}

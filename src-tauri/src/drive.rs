//! Google Drive izvoz. Aplikacija radi offline; mreža se koristi samo u ovim komandama.
//!
//! Prijava: OAuth 2.0 za desktop aplikacije (loopback redirect na 127.0.0.1 + PKCE).
//! Dozvola: samo `drive.file`, pa aplikacija vidi isključivo fajlove koje je sama napravila.
//! Client ID/secret: ili ugrađeni pri buildu (env GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET),
//! ili JSON iz Google Cloud konzole koji korisnik jednom učita u aplikaciji.

use base64::Engine;
use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::PathBuf;
use std::time::{Duration, Instant};
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

const SCOPE: &str = "https://www.googleapis.com/auth/drive.file";
const FOLDER_NAME: &str = "Izborni indeksi";
const LOGIN_TIMEOUT: Duration = Duration::from_secs(300);

#[derive(Serialize, Deserialize, Clone)]
struct Client {
    client_id: String,
    client_secret: String,
}

#[derive(Serialize, Deserialize, Default)]
struct Tokens {
    refresh_token: Option<String>,
    folder_id: Option<String>,
}

#[derive(Serialize)]
pub struct Status {
    configured: bool,
    connected: bool,
}

#[derive(Serialize)]
pub struct Uploaded {
    id: String,
    link: Option<String>,
}

fn config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let d = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&d).map_err(|e| e.to_string())?;
    Ok(d)
}

fn client_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join("google_client.json"))
}

fn tokens_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join("google_token.json"))
}

fn load_client(app: &tauri::AppHandle) -> Option<Client> {
    if let (Some(id), Some(secret)) = (option_env!("GOOGLE_CLIENT_ID"), option_env!("GOOGLE_CLIENT_SECRET")) {
        if !id.is_empty() {
            return Some(Client { client_id: id.into(), client_secret: secret.into() });
        }
    }
    let p = client_path(app).ok()?;
    serde_json::from_str(&std::fs::read_to_string(p).ok()?).ok()
}

fn load_tokens(app: &tauri::AppHandle) -> Tokens {
    tokens_path(app)
        .ok()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_tokens(app: &tauri::AppHandle, t: &Tokens) -> Result<(), String> {
    let p = tokens_path(app)?;
    std::fs::write(&p, serde_json::to_string(t).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&p, std::fs::Permissions::from_mode(0o600));
    }
    Ok(())
}

#[tauri::command]
pub fn drive_status(app: tauri::AppHandle) -> Status {
    Status {
        configured: load_client(&app).is_some(),
        connected: load_tokens(&app).refresh_token.is_some(),
    }
}

/// Prima JSON preuzet iz Google Cloud konzole (tip "Desktop app").
#[tauri::command]
pub fn drive_set_client(app: tauri::AppHandle, json: String) -> Result<(), String> {
    let v: serde_json::Value = serde_json::from_str(&json).map_err(|_| "Fajl nije ispravan JSON.".to_string())?;
    let inner = v.get("installed").or_else(|| v.get("web")).unwrap_or(&v);
    let id = inner.get("client_id").and_then(|x| x.as_str()).unwrap_or_default();
    let secret = inner.get("client_secret").and_then(|x| x.as_str()).unwrap_or_default();
    if id.is_empty() || secret.is_empty() {
        return Err("U fajlu nema client_id/client_secret. Preuzmi JSON za OAuth klijent tipa „Desktop app“.".into());
    }
    let c = Client { client_id: id.into(), client_secret: secret.into() };
    std::fs::write(client_path(&app)?, serde_json::to_string(&c).map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}

fn b64url(bytes: &[u8]) -> String {
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

fn random_string(n: usize) -> String {
    rand::thread_rng().sample_iter(&Alphanumeric).take(n).map(char::from).collect()
}

/// Čeka da Google preusmjeri pregledač na lokalni port i vraća `code`.
fn wait_for_code(listener: TcpListener, expected_state: String) -> Result<String, String> {
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;
    let deadline = Instant::now() + LOGIN_TIMEOUT;
    loop {
        if Instant::now() > deadline {
            return Err("Isteklo je vrijeme za prijavu.".into());
        }
        match listener.accept() {
            Ok((mut stream, _)) => {
                let _ = stream.set_nonblocking(false);
                let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
                let mut buf = [0u8; 8192];
                let n = stream.read(&mut buf).unwrap_or(0);
                let req = String::from_utf8_lossy(&buf[..n]);
                let path = req.lines().next().and_then(|l| l.split_whitespace().nth(1)).unwrap_or("/");
                let url = url::Url::parse(&format!("http://127.0.0.1{path}")).map_err(|e| e.to_string())?;
                let get = |k: &str| url.query_pairs().find(|(a, _)| a == k).map(|(_, v)| v.to_string());
                if get("code").is_none() && get("error").is_none() {
                    // npr. zahtjev za favicon - ignoriši
                    let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n");
                    continue;
                }
                let ok = get("code").is_some() && get("state").as_deref() == Some(expected_state.as_str());
                let body = if ok {
                    "<html><meta charset='utf-8'><body style='font-family:sans-serif;padding:40px'><h2 style='color:#1e62a5'>Prijava uspjela</h2><p>Možeš zatvoriti ovaj prozor i vratiti se u aplikaciju Izborni indeksi.</p></body></html>"
                } else {
                    "<html><meta charset='utf-8'><body style='font-family:sans-serif;padding:40px'><h2>Prijava nije uspjela</h2><p>Vrati se u aplikaciju i pokušaj ponovo.</p></body></html>"
                };
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = stream.write_all(resp.as_bytes());
                if let Some(err) = get("error") {
                    return Err(format!("Google je odbio prijavu: {err}"));
                }
                if !ok {
                    return Err("Neispravan odgovor pri prijavi (state).".into());
                }
                return Ok(get("code").unwrap());
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => std::thread::sleep(Duration::from_millis(150)),
            Err(e) => return Err(e.to_string()),
        }
    }
}

#[derive(Deserialize)]
struct TokenResp {
    access_token: Option<String>,
    refresh_token: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

#[tauri::command]
pub async fn drive_connect(app: tauri::AppHandle) -> Result<(), String> {
    let client = load_client(&app).ok_or("Google klijent nije podešen.")?;
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect = format!("http://127.0.0.1:{port}");
    let verifier = random_string(64);
    let challenge = b64url(&Sha256::digest(verifier.as_bytes()));
    let state = random_string(24);

    let mut auth = url::Url::parse("https://accounts.google.com/o/oauth2/v2/auth").unwrap();
    auth.query_pairs_mut()
        .append_pair("client_id", &client.client_id)
        .append_pair("redirect_uri", &redirect)
        .append_pair("response_type", "code")
        .append_pair("scope", SCOPE)
        .append_pair("code_challenge", &challenge)
        .append_pair("code_challenge_method", "S256")
        .append_pair("state", &state)
        .append_pair("access_type", "offline")
        .append_pair("prompt", "consent");
    app.opener().open_url(auth.as_str(), None::<&str>).map_err(|e| e.to_string())?;

    let code = tauri::async_runtime::spawn_blocking(move || wait_for_code(listener, state))
        .await
        .map_err(|e| e.to_string())??;

    let resp: TokenResp = reqwest::Client::new()
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", code.as_str()),
            ("client_id", client.client_id.as_str()),
            ("client_secret", client.client_secret.as_str()),
            ("redirect_uri", redirect.as_str()),
            ("grant_type", "authorization_code"),
            ("code_verifier", verifier.as_str()),
        ])
        .send()
        .await
        .map_err(|e| format!("Nema veze sa Google-om: {e}"))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    if let Some(err) = resp.error {
        return Err(format!("{err}: {}", resp.error_description.unwrap_or_default()));
    }
    let refresh = resp.refresh_token.ok_or("Google nije vratio refresh token.")?;
    save_tokens(&app, &Tokens { refresh_token: Some(refresh), folder_id: None })
}

#[tauri::command]
pub async fn drive_disconnect(app: tauri::AppHandle) -> Result<(), String> {
    let t = load_tokens(&app);
    if let Some(rt) = t.refresh_token {
        // Opoziv na Google strani; ako nema interneta, lokalni token se svejedno briše.
        let _ = reqwest::Client::new()
            .post("https://oauth2.googleapis.com/revoke")
            .form(&[("token", rt.as_str())])
            .timeout(Duration::from_secs(10))
            .send()
            .await;
    }
    let p = tokens_path(&app)?;
    if p.exists() {
        std::fs::remove_file(p).map_err(|e| e.to_string())?;
    }
    Ok(())
}

async fn access_token(app: &tauri::AppHandle, http: &reqwest::Client) -> Result<String, String> {
    let client = load_client(app).ok_or("Google klijent nije podešen.")?;
    let rt = load_tokens(app).refresh_token.ok_or("Google nalog nije povezan.")?;
    let resp: TokenResp = http
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", client.client_id.as_str()),
            ("client_secret", client.client_secret.as_str()),
            ("refresh_token", rt.as_str()),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| format!("Nema veze sa Google-om: {e}"))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    if let Some(err) = resp.error {
        if err == "invalid_grant" {
            let _ = std::fs::remove_file(tokens_path(app)?);
            return Err("Veza sa Google nalogom je istekla. Poveži nalog ponovo.".into());
        }
        return Err(format!("{err}: {}", resp.error_description.unwrap_or_default()));
    }
    resp.access_token.ok_or_else(|| "Google nije vratio access token.".into())
}

async fn ensure_folder(app: &tauri::AppHandle, http: &reqwest::Client, token: &str) -> Result<String, String> {
    let mut t = load_tokens(app);
    if let Some(id) = &t.folder_id {
        let r = http
            .get(format!("https://www.googleapis.com/drive/v3/files/{id}?fields=id,trashed"))
            .bearer_auth(token)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if r.status().is_success() {
            let v: serde_json::Value = r.json().await.map_err(|e| e.to_string())?;
            if v.get("trashed").and_then(|x| x.as_bool()) != Some(true) {
                return Ok(id.clone());
            }
        }
    }
    let created: serde_json::Value = http
        .post("https://www.googleapis.com/drive/v3/files?fields=id")
        .bearer_auth(token)
        .json(&serde_json::json!({ "name": FOLDER_NAME, "mimeType": "application/vnd.google-apps.folder" }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| format!("Ne mogu da napravim folder na Drive-u: {e}"))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let id = created["id"].as_str().ok_or("Drive nije vratio ID foldera.")?.to_string();
    t.folder_id = Some(id.clone());
    save_tokens(app, &t)?;
    Ok(id)
}

#[tauri::command]
pub async fn drive_upload(app: tauri::AppHandle, name: String, mime: String, data_b64: String) -> Result<Uploaded, String> {
    let bytes = base64::engine::general_purpose::STANDARD.decode(data_b64).map_err(|e| e.to_string())?;
    let http = reqwest::Client::builder().timeout(Duration::from_secs(120)).build().map_err(|e| e.to_string())?;
    let token = access_token(&app, &http).await?;
    let folder = ensure_folder(&app, &http, &token).await?;

    let boundary = format!("izborni{}", random_string(16));
    let meta = serde_json::json!({ "name": name, "parents": [folder] }).to_string();
    let mut body = Vec::with_capacity(bytes.len() + 512);
    body.extend_from_slice(format!("--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{meta}\r\n--{boundary}\r\nContent-Type: {mime}\r\n\r\n").as_bytes());
    body.extend_from_slice(&bytes);
    body.extend_from_slice(format!("\r\n--{boundary}--\r\n").as_bytes());

    let v: serde_json::Value = http
        .post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink")
        .bearer_auth(&token)
        .header("Content-Type", format!("multipart/related; boundary={boundary}"))
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Nema veze sa Google-om: {e}"))?
        .error_for_status()
        .map_err(|e| format!("Drive je odbio fajl: {e}"))?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(Uploaded {
        id: v["id"].as_str().unwrap_or_default().to_string(),
        link: v["webViewLink"].as_str().map(String::from),
    })
}

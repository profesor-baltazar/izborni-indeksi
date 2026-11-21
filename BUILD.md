# Build (samo za tebe)

**GitHub:** Actions → Build Windows → Run workflow. Kad se završi, u **Releases** se pojavi nacrt (draft) izdanja `vX.Y.Z` sa `.exe` i `.msi`. Otvori ga, upiši izmjene i klikni **Publish release**.

Verzija se uzima iz `src-tauri/tauri.conf.json` (`"version"`). Za novo izdanje prvo promijeni verziju; isti broj ne može se objaviti dva puta.

## Automatsko ažuriranje (jednom podesiš)

Aplikacija nove verzije traži na adresi `https://github.com/<korisnik>/<repo>/releases/latest/download/latest.json`, pa **repozitorijum mora biti javan** (ili izdanja objavljuješ u posebnom javnom repozitorijumu).

1. Na svom računaru, u folderu projekta, napravi ključeve za potpisivanje:
   ```
   npx tauri signer generate -w izborni-indeksi.key
   ```
   Upiši lozinku. Dobićeš `izborni-indeksi.key` (privatni) i `izborni-indeksi.key.pub` (javni). Privatni ključ čuvaj van repozitorijuma i nemoj ga izgubiti: bez njega instalirane aplikacije ne mogu primiti nova ažuriranja.
2. Na GitHubu: **Settings → Secrets and variables → Actions**
   - **Secrets:** `TAURI_SIGNING_PRIVATE_KEY` = sadržaj fajla `izborni-indeksi.key`; `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` = lozinka.
   - **Variables:** `TAURI_UPDATER_PUBKEY` = sadržaj fajla `izborni-indeksi.key.pub`.
3. Pokreni workflow i objavi nacrt izdanja. Uz instalere biće i `latest.json` i `.sig` fajlovi; ne briši ih.

Ažuriranje radi od prve verzije izgrađene sa ovim podešavanjima; starije verzije treba jednom ručno instalirati preko nove.
Bez tih podešavanja workflow i dalje pravi instalere, samo bez automatskog ažuriranja.

**Lokalno:** instaliraj Node.js i Rust (rustup), pa:
```
npm install
npm test
npm run build
```
Instaleri: `src-tauri/target/release/bundle/nsis/` i `.../msi/`. Lokalno izgrađena verzija ne provjerava ažuriranja.

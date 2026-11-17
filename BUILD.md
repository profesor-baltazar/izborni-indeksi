# Build (samo za tebe)

**GitHub:** Actions → Build Windows → Run workflow. Instaler preuzmi iz „Artifacts“.

**Lokalno:** instaliraj Node.js i Rust (rustup), pa:
```
npm install
npm test
npm run build
```
Instaleri: `src-tauri/target/release/bundle/nsis/` i `.../msi/`.

**Google Drive:** u Google Cloud konzoli uključi Drive API i napravi OAuth client tipa „Desktop app“. U režimu „Testing“ rade samo dodati test korisnici, a prijava ističe nakon 7 dana; za ostale klikni „Publish app“. Da korisnici ne moraju učitavati JSON, prije builda postavi `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET`. Lokalno su to varijable okruženja, a u GitHub-u repozitorijumski secrets.

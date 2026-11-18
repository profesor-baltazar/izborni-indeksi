# Build (samo za tebe)

**GitHub:** Actions → Build Windows → Run workflow. Instaler preuzmi iz „Artifacts“.

**Lokalno:** instaliraj Node.js i Rust (rustup), pa:
```
npm install
npm test
npm run build
```
Instaleri: `src-tauri/target/release/bundle/nsis/` i `.../msi/`.

// Most prema Tauri (Rust) strani. Bez Tauri-ja (npr. otvoreno u pregledaču) koristi pregledačke zamjene.
(function () {
  const T = window.__TAURI__;
  const isTauri = !!(T && T.core && T.core.invoke);
  const invoke = (cmd, args) => T.core.invoke(cmd, args);

  function toBase64(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin);
  }

  const Platform = {
    isTauri,
    async saveFile(name, bytes) {
      if (isTauri) return invoke('save_file', { name, dataB64: toBase64(bytes) });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([bytes]));
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      return name;
    },
    async driveStatus() {
      if (!isTauri) return { configured: false, connected: false, desktopOnly: true };
      return invoke('drive_status');
    },
    async driveSetClient(json) { return invoke('drive_set_client', { json }); },
    async driveConnect() { return invoke('drive_connect'); },
    async driveDisconnect() { return invoke('drive_disconnect'); },
    async driveUpload(name, mime, bytes) {
      if (!isTauri) throw new Error('Slanje na Google Drive radi samo u desktop aplikaciji.');
      return invoke('drive_upload', { name, mime, dataB64: toBase64(bytes) });
    },
    async openUrl(url) {
      if (isTauri) return invoke('open_url', { url });
      window.open(url, '_blank');
    },
  };
  window.Platform = Platform;
})();

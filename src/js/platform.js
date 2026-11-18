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
  };
  window.Platform = Platform;
})();

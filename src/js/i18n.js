// Jezik interfejsa: crnogorski (izvorni tekstovi u kodu) i engleski (prevod ispod).
(function () {
  const KEY = 'izborni-indeksi-jezik';
  const EN = {
    // opšte
    'Izborni indeksi': 'Election Indices',
    'Moduli': 'Modules',
    'Rezultati i indeksi': 'Results and indices',
    'Raspodjela mandata': 'Seat allocation',
    'Nacionalizacija stranaka': 'Party nationalisation',
    'Volatilnost': 'Volatility',
    'Izbori': 'Elections',
    '+ Novi izbori': '+ New election',
    'Rezervna kopija (JSON)': 'Backup (JSON)',
    'Vrati iz kopije': 'Restore from backup',
    'Izvoz': 'Export',
    'CSV (ovaj modul)': 'CSV (this module)',
    'Excel (svi moduli)': 'Excel (all modules)',
    'PDF / štampa': 'PDF / print',
    'Tema: kao sistem': 'Theme: system',
    'Tema: svijetla': 'Theme: light',
    'Tema: tamna': 'Theme: dark',
    'Tema': 'Theme',
    'Jezik': 'Language',
    'Potvrdi': 'Confirm',
    'Otkaži': 'Cancel',
    'U redu': 'OK',
    'Zatvori': 'Close',
    'Još nema izbora': 'No elections yet',
    'Nema izbora.': 'No elections.',
    'Klikni da promijeniš naziv izbora': 'Click to rename the election',
    'Naziv izbora': 'Election name',
    'Dupliraj': 'Duplicate',
    'Obriši izbore': 'Delete election',
    'Zalijepi iz Excela': 'Paste from Excel',
    'Uvezi XLSX/CSV': 'Import XLSX/CSV',
    // cenzus
    'Opšti': 'General',
    'Opšti ({p}%)': 'General ({p}%)',
    'Manjinski (0,7%)': 'Minority (0.7%)',
    'Hrvatski (0,35%)': 'Croatian (0.35%)',
    'Cenzus koji važi za ovu listu': 'Threshold that applies to this list',
    'Cenzus': 'Threshold',
    // rezultati
    'Naziv liste ili stranke': 'List or party name',
    'Ukloni listu': 'Remove list',
    'Lista / stranka': 'List / party',
    'Lista': 'List',
    'Glasovi': 'Votes',
    'Mandati': 'Seats',
    'Ukupno': 'Total',
    '+ Dodaj listu': '+ Add list',
    'Indeks disproporcionalnosti (LSq)': 'Disproportionality index (LSq)',
    '0 = savršena proporcionalnost': '0 = perfect proportionality',
    'Efektivni broj izbornih stranaka (ENEP)': 'Effective number of electoral parties (ENEP)',
    'na osnovu glasova': 'based on votes',
    'Efektivni broj parlamentarnih stranaka (ENPP)': 'Effective number of parliamentary parties (ENPP)',
    'na osnovu mandata': 'based on seats',
    'Ukupno glasova': 'Total votes',
    'Ukupno mandata': 'Total seats',
    // raspodjela
    'Broj mandata': 'Number of seats',
    'Metoda': 'Method',
    'Opšti cenzus (%)': 'General threshold (%)',
    'Glasovi u posebnoj jedinici': 'Votes in the special unit',
    'Dodijeljeno': 'Allocated',
    'Stvarno': 'Actual',
    'Razlika': 'Difference',
    'LSq za ovu raspodjelu': 'LSq for this allocation',
    'LSq za raspodjelu': 'LSq for the allocation',
    'Gallagherov indeks disproporcionalnosti': "Gallagher's disproportionality index",
    'Posljednji mandat je neriješen (isti količnik/ostatak). Zakon obično propisuje kako se takav slučaj rješava; provjeri ručno.':
      'The last seat is tied (equal quotient/remainder). The law usually specifies how such a case is resolved; check it manually.',
    // nacionalizacija
    'Opština / jedinica': 'Municipality / unit',
    'Ukloni jedinicu': 'Remove unit',
    'Teritorijalna jedinica': 'Territorial unit',
    'Važeći glasovi': 'Valid votes',
    'Dodaj opštine (ili druge jedinice) i unesi glasove svake liste u njima.': 'Add municipalities (or other units) and enter the votes of each list in them.',
    '+ Dodaj jedinicu': '+ Add unit',
    'Obriši sve jedinice': 'Delete all units',
    'sPNS sistema (standardizovan)': 'Party system sPNS (standardised)',
    'ponderisan udjelom glasova': 'weighted by vote share',
    'PNSw sistema (ponderisan)': 'Party system PNSw (weighted)',
    '0 = koncentrisano, 1 = ravnomjerno': '0 = concentrated, 1 = even',
    'Efektivni broj jedinica (E)': 'Effective number of units (E)',
    'N2 državni / N2 jedinice': 'N2 national / N2 units',
    'efektivni broj stranaka': 'effective number of parties',
    'Po listama': 'By list',
    'od {n} jedinica': 'of {n} units',
    'potrebne su bar 2 jedinice': 'at least 2 units are needed',
    'Za neke jedinice nisu uneseni važeći glasovi, pa je korišćen zbir unesenih lista. Za tačan PNS unesi sve važeće glasove.':
      'Valid votes are missing for some units, so the sum of the entered lists was used. For an accurate PNS, enter all valid votes.',
    'Broj jedinica': 'Number of units',
    'N2 državni': 'N2 national',
    'N2 jedinice (ponderisan)': 'N2 units (weighted)',
    'Napomena': 'Note',
    'Potrebne su bar 2 teritorijalne jedinice': 'At least 2 territorial units are needed',
    'Jedinica': 'Unit',
    'jedinice': 'units',
    // volatilnost
    'Prvi izbori (t₁)': 'First election (t₁)',
    'Drugi izbori (t₂)': 'Second election (t₂)',
    'Osnova': 'Basis',
    'Glasovi (izborna volatilnost)': 'Votes (electoral volatility)',
    'Mandati (parlamentarna volatilnost)': 'Seats (parliamentary volatility)',
    'Izaberi dvoje različitih izbora.': 'Select two different elections.',
    'Ukupna volatilnost (Pedersen)': 'Total volatility (Pedersen)',
    'u procentnim poenima': 'in percentage points',
    'Tip A (nove i ugašene stranke)': 'Type A (new and withdrawn parties)',
    'Tip B (stabilne stranke)': 'Type B (stable parties)',
    'Povezivanje lista': 'Linking lists',
    'Poveži liste istog imena': 'Link lists with the same name',
    'Ukloni sve veze': 'Remove all links',
    'prethodnik(ci):': 'predecessor(s):',
    'Objašnjenje': 'Explanation',
    'Za volatilnost su potrebni bar dvoje izbora. Dodaj i druge izbore u modulu „Rezultati i indeksi“.':
      'Volatility needs at least two elections. Add another election in the “Results and indices” module.',
    'Nijedna lista nije povezana sa prethodnicom, pa se sve liste računaju kao nove (volatilnost 100). Poveži liste u dijelu „Povezivanje lista“ ispod.':
      'No list is linked to a predecessor, so all lists count as new (volatility 100). Link the lists under “Linking lists” below.',
    'Na t1': 'At t1',
    'Na t2': 'At t2',
    'Prvi izbori': 'First election',
    'Drugi izbori': 'Second election',
    'mandati': 'seats',
    'glasovi': 'votes',
    'Ukupna volatilnost (TV)': 'Total volatility (TV)',
    'Tip A': 'Type A',
    'Tip B': 'Type B',
    // akcije i poruke
    'Napravljena kopija izbora': 'Election duplicated',
    ' (kopija)': ' (copy)',
    'Obriši': 'Delete',
    'Da li sigurno želiš da obrišeš „{name}“? Ovo se ne može poništiti (osim iz rezervne kopije).':
      'Are you sure you want to delete “{name}”? This cannot be undone (except from a backup).',
    'Ukloni': 'Remove',
    'Ukloniti „{name}“ iz ovih izbora (zajedno sa njenim glasovima po jedinicama)?': 'Remove “{name}” from this election (together with its votes by unit)?',
    'Obriši jedinice': 'Delete units',
    'Obrisati sve teritorijalne jedinice za ove izbore?': 'Delete all territorial units for this election?',
    'Naziv novih izbora': 'Name of the new election',
    'Dodaj liste i unesi glasove i mandate': 'Add lists and enter votes and seats',
    'Nova lista': 'New list',
    'Nova jedinica': 'New unit',
    'Novi izbori': 'New election',
    // uvoz
    'Stari .xls format nije podržan. U Excelu sačuvaj kao .xlsx ili kopiraj ćelije i koristi „Zalijepi iz Excela“.':
      'The old .xls format is not supported. Save it as .xlsx in Excel, or copy the cells and use “Paste from Excel”.',
    'Nema podataka.': 'No data.',
    'Uvezeno lista: {n}': 'Lists imported: {n}',
    'Uvezeno jedinica: {n}': 'Units imported: {n}',
    ', novih lista: {n} (unesi im državne rezultate u modulu „Rezultati“)': ', new lists: {n} (enter their national results in the “Results” module)',
    'Kolone: <b>naziv liste</b>, <b>glasovi</b>, <b>mandati</b>. Prvi red smije biti zaglavlje. Postojeće liste ovih izbora biće zamijenjene.':
      'Columns: <b>list name</b>, <b>votes</b>, <b>seats</b>. The first row may be a header. The existing lists of this election will be replaced.',
    'Kolone: <b>naziv jedinice</b>, <b>važeći glasovi</b>, pa po jedna kolona za svaku listu. U prvom redu napiši imena lista (iste kao u modulu „Rezultati“); nepoznata imena dodaju se kao nove liste. Bez zaglavlja kolone se redom dodjeljuju postojećim listama. Red „Ukupno“ se preskače.':
      'Columns: <b>unit name</b>, <b>valid votes</b>, then one column per list. Put the list names in the first row (the same as in the “Results” module); unknown names are added as new lists. Without a header, the columns are assigned to the existing lists in order. A “Total” row is skipped.',
    'Uvoz iz fajla': 'Import from file',
    'Fajl: <b>{name}</b>, redova: {n}. Nastaviti?': 'File: <b>{name}</b>, rows: {n}. Continue?',
    'Uvezi': 'Import',
    'U Excelu označi ćelije, kopiraj (Ctrl+C) i zalijepi ovdje (Ctrl+V).': 'Select the cells in Excel, copy (Ctrl+C) and paste here (Ctrl+V).',
    'Opština\tVažeći glasovi\tLista 1\tLista 2': 'Municipality\tValid votes\tList 1\tList 2',
    // izvoz
    'volatilnost': 'volatility',
    'Nema podataka za izvoz': 'Nothing to export',
    'Izvor': 'Source',
    'Sačuvano: {p}': 'Saved: {p}',
    'Rezultati': 'Results',
    'Raspodjela': 'Allocation',
    'Nacionalizacija': 'Nationalisation',
    'Izvori': 'Sources',
    'Izvori formula': 'Formula sources',
    '{name} — rezultati i indeksi': '{name} — results and indices',
    '{name} — raspodjela mandata': '{name} — seat allocation',
    '{name} — nacionalizacija stranaka (Bochsler 2010)': '{name} — party nationalisation (Bochsler 2010)',
    'Izvoz nije uspio: {e}': 'Export failed: {e}',
    // rezervna kopija
    'izborni_indeksi_kopija_': 'election_indices_backup_',
    'Kopija sačuvana': 'Backup saved',
    'Fajl nije kopija ove aplikacije.': 'The file is not a backup of this application.',
    'Zamijeniti sve trenutne podatke sa kopijom ({n} izbora)?': 'Replace all current data with the backup ({n} elections)?',
    'Zamijeni': 'Replace',
    'Podaci vraćeni': 'Data restored',
  };

  const I18N = {
    lang: localStorage.getItem(KEY) === 'en' ? 'en' : 'me',
    t(s, vars) {
      let out = I18N.lang === 'en' && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s;
      if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
      return out;
    },
    locale() { return I18N.lang === 'en' ? 'en-GB' : 'sr-Latn-ME'; },
    has(s) { return Object.prototype.hasOwnProperty.call(EN, s); },
    set(l) {
      I18N.lang = l === 'en' ? 'en' : 'me';
      try { localStorage.setItem(KEY, I18N.lang); } catch (e) { /* ignore */ }
      I18N.apply();
    },
    // statički tekstovi u index.html: data-i18n (tekst) i data-i18n-title (opis)
    apply(root = document) {
      document.documentElement.lang = I18N.lang === 'en' ? 'en' : 'sr-Latn-ME';
      root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = I18N.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = I18N.t(el.dataset.i18nTitle); });
      document.title = I18N.t('Izborni indeksi');
      try { window.__TAURI__?.core?.invoke('set_lang', { lang: I18N.lang }); } catch (e) { /* van Tauri-ja */ }
    },
  };
  window.I18N = I18N;
})();

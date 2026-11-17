# Izborni indeksi

Aplikacija za računanje izbornih indeksa. Radi bez interneta. Svi podaci ostaju na tvom računaru.

## Instalacija

Pokreni instalacioni `.exe` fajl i prati korake. Ako Windows prikaže upozorenje „Windows protected your PC“, klikni **More info → Run anyway**.

## Moduli

- **Rezultati i indeksi:** disproporcionalnost (LSq) i efektivni broj stranaka po glasovima (ENEP) i mandatima (ENPP).
- **Raspodjela mandata:** D'Hondt, Sainte-Laguë ili Hare–Niemeyer, sa cenzusom. Za pojedinačne liste možeš zadati poseban cenzus ili garantovane mandate.
- **Nacionalizacija stranaka:** koliko je podrška stranke ravnomjerno raspoređena po opštinama (Bochsler).
- **Volatilnost:** koliki se dio glasova pomjerio između stranaka od jednih do drugih izbora.

Uz svaki modul je naveden izvor formule.

## Unos podataka

- Naziv izbora mijenjaš klikom na naslov, a imena lista i opština direktno u tabeli.
- Podatke možeš kopirati iz Excela: označi ćelije, Ctrl+C, pa u aplikaciji **Zalijepi iz Excela** i Ctrl+V. Može i uvoz `.xlsx` ili `.csv` fajla. Stari format `.xls` prvo sačuvaj kao `.xlsx`.
- Za volatilnost unesi bar dvoje izbora. Liste istog imena povezuju se same. Koalicije i stranke koje su promijenile ime povežeš klikom na ime prethodnika.

## Izvoz

Dugmad na dnu ekrana:

- **CSV:** tabela trenutnog modula.
- **Excel:** svi moduli u jednom fajlu.
- **PDF / štampa:** u prozoru za štampu izaberi „Microsoft Print to PDF“.
- **Google Drive:** šalje Excel fajl u folder „Izborni indeksi“ na tvom Drive-u.

Za Google Drive klikni **Google Drive → Poveži** i prijavi se u pregledaču. Aplikacija vidi samo fajlove koje je sama napravila. Ako traži JSON fajl, dobićeš ga od osobe koja ti je dala aplikaciju. Vezu prekidaš istim dugmetom.

## Rezervna kopija

**Rezervna kopija (JSON)** u lijevom meniju čuva sve izbore u jedan fajl. **Vrati iz kopije** ih vraća, na primjer na drugom računaru.

## Izgled

Tema može biti svijetla, tamna ili kao sistem (izbor gore desno). Akcentna boja prati boju izabranu u Windowsu.

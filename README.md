# Electoral & Party System Indices (Indeksi izbornih i stranačkih sistema)

Aplikacija za računanje izbornih indeksa. Radi bez interneta. Svi podaci ostaju na tvom računaru. Internet koristi samo za provjeru da li postoji nova verzija.

## Instalacija

Pokreni instalacioni `.exe` fajl i prati korake. Ako Windows prikaže upozorenje „Windows protected your PC“, klikni **More info → Run anyway**.

## Moduli

- **Rezultati i indeksi:** disproporcionalnost (Gallagher LSq, Loosemore–Hanby, Sainte-Laguë), efektivni broj stranaka (ENEP, ENPP, Golosov), frakcionalizacija (Rae F) i odnos prednosti za svaku listu.
- **Raspodjela mandata:** D'Hondt, Sainte-Laguë ili Hare–Niemeyer. Za svake izbore zadaješ pravila cenzusa (npr. poseban cenzus za koalicije, izuzeće ili zbirnu listu za manjine, garantovani mandat, uvećane količnike), a za svaku listu biraš koje pravilo važi. Može se dodati i posebna izborna jedinica sa svojim brojem mandata.
- **Nacionalizacija stranaka:** koliko je podrška stranke ravnomjerno raspoređena po opštinama (Bochsler).
- **Volatilnost:** koliki se dio glasova pomjerio između stranaka od jednih do drugih izbora.
- **Poređenje:** biraš države, izbore i indekse. Dobijaš grafikon kroz vrijeme i tabelu po godinama, sa prosjekom; klikom na zaglavlje kolone tabela se sortira. Dugme „Posljednji izbori svake države“ pravi tabelu sa po jednim redom za svaku državu. Kad pređeš mišem preko skraćenice (LSq, ENEP…), vidiš puno ime indeksa.

Uz svaki modul je naveden izvor formule.

## Unos podataka

- Izbori su grupisani po državama. **+ Nova država** dodaje državu, a **+ Novi izbori** ispod države dodaje izbore u nju (naziv i godina).

- Naziv izbora mijenjaš klikom na naslov, a imena lista i opština direktno u tabeli.
- Podatke možeš kopirati iz Excela: označi ćelije, Ctrl+C, pa u aplikaciji **Zalijepi iz Excela** i Ctrl+V. Može i uvoz `.xls`, `.xlsx` ili `.csv` fajla.
- Bochslerov originalni Excel alat za nacionalizaciju (`.xls`) uvoziš direktno u modulu **Nacionalizacija stranaka**; aplikacija ga sama prepoznaje.
- Ako upišeš zvanični broj važećih glasova, aplikacija upozorava kada se zbir glasova lista ne poklapa s njim, kao i kada zbir mandata nije jednak broju mandata.
- Za volatilnost unesi bar dvoje izbora. Liste istog imena povezuju se same. Koalicije i stranke koje su promijenile ime povežeš klikom na ime prethodnika. Veze se pamte i koriste i u pregledu kroz vrijeme.

## Izvoz

Dugmad na dnu ekrana:

- **CSV:** tabela trenutnog modula.
- **Excel:** svi moduli u jednom fajlu.
- **PDF / štampa:** u prozoru za štampu izaberi „Microsoft Print to PDF“.

## Rezervna kopija

**Rezervna kopija (JSON)** u lijevom meniju čuva sve izbore u jedan fajl. **Vrati iz kopije** ih vraća, na primjer na drugom računaru.

## Izgled i jezik

Gore desno biraš jezik (EN – engleski, ME – crnogorski; aplikacija se prvi put otvara na engleskom) i temu (svijetla, tamna ili kao sistem). Akcentna boja prati boju izabranu u Windowsu.

## Ažuriranje

Kada izađe nova verzija, aplikacija pri pokretanju prikaže traku **Dostupna je nova verzija**. Klikni **Ažuriraj i ponovo pokreni**; podaci ostaju sačuvani.

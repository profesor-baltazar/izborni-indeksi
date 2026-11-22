# Electoral & Party System Indices (Indeksi izbornih i stranačkih sistema)

Aplikacija za računanje izbornih indeksa. Radi bez interneta. Svi podaci ostaju na tvom računaru. Internet koristi samo za provjeru da li postoji nova verzija.

## Instalacija

Pokreni instalacioni `.exe` fajl i prati korake. Ako Windows prikaže upozorenje „Windows protected your PC“, klikni **More info → Run anyway**.

## Moduli

- **Rezultati:** unos lista, glasova i mandata, boje lista, provjera unosa i grafikoni sastava (polukrug skupštine sa kružićem za svaki mandat, pita udjela glasova ili mandata).
- **Indeksi:** disproporcionalnost (Gallagher LSq, Loosemore–Hanby, Sainte-Laguë), efektivni broj stranaka (ENEP, ENPP, Golosov), frakcionalizacija (Rae F), izgubljeni glasovi, broj lista sa mandatima, najveća stranka i bonus pobjednika, efektivni prag, izlaznost i nevažeći listići i tabela po listama sa udjelom glasova, udjelom mandata i odnosom prednosti, uz grafikon glasova i mandata.
- **Raspodjela mandata:** D'Hondt, Sainte-Laguë ili Hare–Niemeyer. Za svake izbore zadaješ pravila cenzusa (npr. poseban cenzus za koalicije, izuzeće ili zbirnu listu za manjine, garantovani mandat, uvećane količnike), a za svaku listu biraš koje pravilo važi. Može se dodati i posebna izborna jedinica sa svojim brojem mandata. Tabela „Poređenje metoda“ pokazuje raspodjelu po sve tri metode, sa LSq za svaku.
- **Nacionalizacija stranaka:** koliko je podrška stranke ravnomjerno raspoređena po opštinama (Bochsler).
- **Volatilnost:** koliki se dio glasova pomjerio između stranaka od jednih do drugih izbora.
- **Zastupljenost žena:** za svaku listu broj kandidata, broj žena na listi, izabrane žene i žene na kraju saziva (nakon ostavki i zamjena). Za svake izbore zadaješ kvotu za manje zastupljeni pol (najmanji procenat na listi i pravilo „najmanje K na svakih N mjesta“). Aplikacija računa udio žena među kandidatima, među izabranima i na kraju saziva, minimum po kvoti i višak iznad njega, liste na minimumu, stopu uspjeha žena i muškaraca i njihov odnos. Za raspored žena na listama upisuješ brojeve prebrojane sa liste kandidata: mjesto prve žene, koliko je žena na 1, 2, … N-tom mjestu u grupi i koliko je žena u svakoj desetki mjesta. Iz toga aplikacija računa liste koje predvodi žena, zbirove i udio žena po desetkama, i upozorava kada se zbirovi ne slažu sa brojem žena na listi.
- **Poređenje:** biraš države, izbore i indekse. Dobijaš grafikon kroz vrijeme i tabelu po godinama, sa prosjekom; klikom na zaglavlje kolone tabela se sortira. Dugme „Posljednji izbori svake države“ pravi tabelu sa po jednim redom za svaku državu. Kad pređeš mišem preko skraćenice (LSq, ENEP…), vidiš puno ime indeksa.

Uz svaki modul je naveden izvor formule, a dugme **?** pored indeksa objašnjava šta indeks mjeri i kako se čita.

## Unos podataka

- Izbori su grupisani po državama. **+ Nova država** dodaje državu, a **+ Novi izbori** ispod države dodaje izbore u nju (naziv i godina).

- Naziv izbora mijenjaš klikom na naslov, a imena lista i opština direktno u tabeli.
- Podatke možeš kopirati iz Excela: označi ćelije, Ctrl+C, pa u aplikaciji **Zalijepi iz Excela** i Ctrl+V. Može i uvoz `.xls`, `.xlsx` ili `.csv` fajla.
- Bochslerov originalni Excel alat za nacionalizaciju (`.xls`) uvoziš direktno u modulu **Nacionalizacija stranaka**; aplikacija ga sama prepoznaje.
- Ako upišeš zvanični broj važećih glasova, aplikacija upozorava kada se zbir glasova lista ne poklapa s njim, kao i kada zbir mandata nije jednak broju mandata.
- Za volatilnost unesi bar dvoje izbora. Liste istog imena povezuju se same. Koalicije i stranke koje su promijenile ime povežeš klikom na ime prethodnika. Veze se pamte i koriste i u pregledu kroz vrijeme.

## Grafikoni i boje

- Boju liste biraš klikom na kvadratić na početku reda u tabeli; boja važi i za istu stranku u drugim izborima (isti naziv ili veza iz modula Volatilnost).
- Redosljed stranaka u polukrugu mijenjaš strelicama pored grafikona; „Označi žene“ prikazuje mandate žena kao prstenove.
- U Poređenju biraš linije, vertikalne stubiće ili horizontalne trake, a boju svake serije kvadratićem ispod grafikona.
- **Sačuvaj kao PNG / SVG** čuva grafikon kao sliku sa bijelom pozadinom.

## Izvoz

Dugmad na dnu ekrana:

- **CSV:** tabela trenutnog modula.
- **Excel:** svi moduli u jednom fajlu.
- **PDF / štampa:** u prozoru za štampu izaberi „Microsoft Print to PDF“.

## Razmjena podataka

- **Izvezi** (u zaglavlju izbora) ili ⤓ pored države čuva jedne izbore ili cijelu državu u fajl koji možeš poslati drugima; **Uvezi državu ili izbore** ih dodaje postojećim podacima, bez brisanja.
- **Uvezi iz ParlGov baze:** preuzmi `view_election.csv` sa parlgov.org (Data → Elections), izaberi države i aplikacija pravi izbore. Glasovi su u procentima; zakonski cenzus upiši sam.

## Rezervna kopija

**Rezervna kopija (JSON)** u lijevom meniju čuva sve izbore u jedan fajl. **Vrati iz kopije** ih vraća, na primjer na drugom računaru.

## Izgled i jezik

Gore desno biraš jezik (EN – engleski, ME – crnogorski; aplikacija se prvi put otvara na engleskom) i temu (svijetla, tamna ili kao sistem). Akcentna boja prati boju izabranu u Windowsu.

## Ažuriranje

Kada izađe nova verzija, aplikacija pri pokretanju prikaže traku **Dostupna je nova verzija**. Klikni **Ažuriraj i ponovo pokreni**; podaci ostaju sačuvani. Dugme **Provjeri ažuriranja** na dnu lijevog menija provjerava odmah i, ako provjera ne uspije, prikazuje razlog.

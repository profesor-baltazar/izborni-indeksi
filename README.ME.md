# Indeksi izbornih i stranačkih sistema

English: [README.md](README.md)

Aplikacija služi za računanje izbornih indeksa i učešća žena na izborima.
Aplikacija radi bez interneta. Svi podaci ostaju lokalno, na računaru. Internet se koristi samo za provjeru da li postoji nova verzija aplikacije.

## Instalacija

Pokreni instalacioni `.exe` fajl i prati korake. Ako Windows prikaže upozorenje „Windows protected your PC“, klikni **More info → Run anyway**.

## Moduli

| Modul | Funkcija |
|---|---|
| **Rezultati** | Unos izbornih lista, glasova i mandata, mogućnost odabira boje lista i provjera unosa. Mogućnost kreiranja grafikona: polukrug skupštine sa kružićem za svaki mandat i pie chart udjela glasova ili mandata. |
| **Indeksi** | Disproporcionalnost (Gallagher LSq, Loosemore–Hanby, Sainte-Laguë), efektivni broj stranaka (ENEP, ENPP, Golosov), frakcionalizacija (Rae F), izgubljeni glasovi, broj lista sa mandatima, najveća stranka i bonus pobjednika, efektivni prag, izlaznost i nevažeći listići. Tabela po listama sa udjelom glasova, udjelom mandata i odnosom prednosti, uz grafikon glasova i mandata. |
| **Raspodjela mandata** | D'Hondt, Sainte-Laguë ili Hare–Niemeyer. Aplikacija omogućava da se za svake izbore zadaju pravila cenzusa (poseban cenzus za koalicije, izuzeće ili zbirna lista za manjine, garantovani mandat, uvećani količnici), a za svaku listu može se izabrati pravilo koje važi. Može se dodati i posebna izborna jedinica. Tabela „Poređenje metoda“ pokazuje raspodjelu po sve tri metode, sa LSq za svaku. |
| **Nacionalizacija stranaka** | Koliko je podrška stranke ravnomjerno raspoređena po opštinama (Bochsler, sPNS i PNSw). |
| **Volatilnost** | Koliki se dio glasova pomjerio između stranaka od jednih do drugih izbora (Pedersen; tip A i B po Powellu i Tuckeru). |
| **Zastupljenost žena** | Po listi: broj kandidata, žene na listi, izabrane žene i žene na kraju saziva. Po izborima: kvota za manje zastupljeni pol (najmanji procenat i pravilo „najmanje K na svakih N mjesta“). Računa udio žena među kandidatima, izabranima i na kraju saziva, minimum po kvoti i višak iznad njega, liste na minimumu, stopu uspjeha žena i muškaraca i njihov odnos. Raspored žena na listama unosi se kao brojevi prebrojani sa liste (što se radi ručno): mjesto prve žene, žene po mjestu u grupi i na svakih 10 mjesta na listi. |
| **Poređenje** | Mogućnost odabira države, izbora i indeksa i generisanje grafikona (linije, stubići ili trake) i tabela po izborima, sa prosjekom. Klik na zaglavlje sortira tabelu; „Posljednji izbori svake države“ daje po jedan red za svaku državu. |

Dugme **?** pored indeksa objašnjava šta indeks mjeri i kako se čita.

## Funkcionalnosti

| Funkcionalnost | Objašnjenje |
|---|---|
| **Države i izbori** | Izbori su grupisani po državama. **+ Nova država** dodaje državu, a **+ Novi izbori** ispod države dodaje izbore (naziv i godina). Naziv izbora mijenja se klikom na naslov, a imena lista i opština direktno u tabeli. |
| **Unos iz Excela** | Označi ćelije u Excelu, Ctrl+C, pa u aplikaciji **Zalijepi iz Excela** i Ctrl+V. Moguć je i uvoz `.xls`, `.xlsx` ili `.csv` fajla. Bochslerov originalni Excel alat za nacionalizaciju (`.xls`) uvozi se direktno u modulu Nacionalizacija stranaka. |
| **Provjera unosa** | Ako se upiše zvanični broj važećih glasova, aplikacija upozorava kada se zbir glasova lista ne poklapa s njim, kao i kada zbir mandata nije jednak broju mandata. |
| **Veze između lista** | Liste istog imena na različitim izborima povezuju se same. Koalicije i stranke koje su promijenile ime povezuju se u modulu Volatilnost klikom na ime prethodnika. Veze se koriste za volatilnost, boje i Poređenje. |
| **Boje lista** | Boja se bira klikom na kvadratić na početku reda u tabeli. Važi i za istu stranku na drugim izborima (isti naziv ili veza). |
| **Grafikoni** | Redosljed stranaka u polukrugu mijenja se strelicama pored grafikona; **Označi žene** prikazuje mandate žena kao prstenove. U Poređenju se mogu birati linije, stubići ili trake i boja svake serije. **Sačuvaj kao PNG / SVG** čuva grafikon kao sliku sa bijelom pozadinom. |
| **Izvoz** | Dugmad na dnu ekrana: **CSV** (tabela trenutnog modula), **Excel** (svi moduli u jednom fajlu) i **PDF / štampa** (u prozoru za štampu izaberi „Microsoft Print to PDF“). |
| **Razmjena podataka** | **Izvezi** u zaglavlju izbora ili ⤓ pored države čuva jedne izbore ili cijelu državu u fajl koji se može poslati drugima. **Uvezi državu ili izbore** ih dodaje postojećim podacima, bez brisanja. |
| **Uvoz iz ParlGov baze** | Fajl `view_election.csv` preuzima se sa parlgov.org (Data → Elections) i uvozi dugmetom **Uvezi iz ParlGov baze**. Izborom države aplikacija pravi izbore. Glasovi su u procentima; zakonski cenzus upisuje se ručno. |
| **Rezervna kopija** | **Rezervna kopija (JSON)** u lijevom meniju čuva sve izbore u jedan fajl, a **Vrati iz kopije** ih vraća (na primjer na drugom računaru). |
| **Jezik i tema** | U gornjem desnom uglu moguće je izabrati jezik aplikacije (EN – engleski, ME – crnogorski; aplikacija se prvi put otvara na engleskom) i temu (svijetla, tamna ili kao sistem). Akcentna boja prati boju izabranu u Windowsu. |
| **Ažuriranje** | Kada izađe nova verzija, aplikacija pri pokretanju prikaže traku **Dostupna je nova verzija**; klikni **Ažuriraj i ponovo pokreni**, podaci ostaju sačuvani. Dugme **Provjeri ažuriranja** na dnu lijevog menija provjerava odmah. |
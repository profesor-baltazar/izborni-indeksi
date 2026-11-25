# Electoral & Party System Indices

Crnogorski: [README.ME.md](README.ME.md)

The application calculates electoral indices and the participation of women in elections.
It works offline. All data stay locally, on your computer. The internet is used only to check whether a new version of the application is available.

## Installation

Run the installation `.exe` file and follow the steps. If Windows shows the warning “Windows protected your PC”, click **More info → Run anyway**.

## Modules

| Module | Function |
|---|---|
| **Results** | Entry of electoral lists, votes and seats, choice of list colours and input checks. Charts: a parliament hemicycle with a dot for each seat and a pie chart of vote or seat shares. |
| **Indices** | Disproportionality (Gallagher LSq, Loosemore–Hanby, Sainte-Laguë), effective number of parties (ENEP, ENPP, Golosov), fractionalisation (Rae F), wasted votes, number of lists with seats, largest party and winner’s bonus, effective threshold, turnout and invalid ballots. A table by list with vote share, seat share and advantage ratio, with a chart of votes and seats. |
| **Seat allocation** | D'Hondt, Sainte-Laguë or Hare–Niemeyer. For each election you can set threshold rules (a separate threshold for coalitions, an exemption or a joint list for minorities, a guaranteed seat, increased quotients), and for each list choose which rule applies. A special electoral unit can also be added. The “Comparison of methods” table shows the allocation by all three methods, with LSq for each. |
| **Party nationalisation** | How evenly a party’s support is spread across municipalities (Bochsler, sPNS and PNSw). |
| **Volatility** | What share of votes moved between parties from one election to the next (Pedersen; types A and B after Powell and Tucker). |
| **Representation of women** | By list: number of candidates, women on the list, elected women and women at the end of the term. By election: quota for the under-represented sex (minimum percentage and the rule “at least K in every N places”). Calculates the share of women among candidates, among the elected and at the end of the term, the quota minimum and the excess above it, lists at the minimum, the success rates of women and men and their ratio. The placement of women on the lists is entered as numbers counted from the list (done manually): the position of the first woman, women by position within the group and in every ten places on the list. |
| **Comparison** | Choose countries, elections and indices and get a chart (lines, columns or bars) and a table by election, with the average. Clicking a column header sorts the table; “Latest election in each country” gives one row per country. |

The **?** button next to an index explains what the index measures and how to read it.

## Features

| Feature | Description |
|---|---|
| **Countries and elections** | Elections are grouped by country. **+ New country** adds a country, and **+ New election** below a country adds an election to it (name and year). The election name is changed by clicking the title, and list and municipality names directly in the table. |
| **Entry from Excel** | Select cells in Excel, Ctrl+C, then in the application **Paste from Excel** and Ctrl+V. Importing an `.xls`, `.xlsx` or `.csv` file is also possible. Bochsler’s original Excel tool for nationalisation (`.xls`) is imported directly in the Party nationalisation module. |
| **Input checks** | If the official number of valid votes is entered, the application warns when the sum of list votes does not match it, and when the sum of seats does not equal the number of seats. |
| **Links between lists** | Lists with the same name in different elections are linked automatically. Coalitions and parties that changed their name are linked in the Volatility module by clicking the name of the predecessor. Links are used for volatility, colours and Comparison. |
| **List colours** | The colour is chosen by clicking the square at the start of the row in the table. It also applies to the same party in other elections (same name or link). |
| **Charts** | The order of parties in the hemicycle is changed with the arrows next to the chart; **Mark women** shows women’s seats as rings. In Comparison you can choose lines, columns or bars and the colour of each series. **Save as PNG / SVG** saves the chart as an image with a white background. |
| **Export** | Buttons at the bottom of the screen: **CSV** (table of the current module), **Excel** (all modules in one file) and **PDF / print** (in the print dialog choose “Microsoft Print to PDF”). |
| **Data exchange** | **Export** in the election header or ⤓ next to a country saves one election or the whole country to a file that can be sent to others. **Import country or election** adds them to the existing data, without deleting anything. |
| **Import from ParlGov** | The file `view_election.csv` is downloaded from parlgov.org (Data → Elections) and imported with the **Import from ParlGov** button. When you choose countries, the application creates the elections. Votes are in percentages; the legal threshold is entered manually. |
| **Backup** | **Backup (JSON)** in the left menu saves all elections to one file, and **Restore from backup** brings them back (for example on another computer). |
| **Language and theme** | In the top right corner you can choose the language of the application (EN – English, ME – Montenegrin; the application opens in English the first time) and the theme (light, dark or system). The accent colour follows the colour chosen in Windows. |
| **Updates** | When a new version is released, the application shows the bar **A new version … is available** at startup; click **Update and restart**, and your data are kept. The **Check for updates** button at the bottom of the left menu checks immediately. |

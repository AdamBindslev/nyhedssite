# ✦ ASTRAL OBSIDIAN • Kiosk Dashboard

Et stemningsfuldt, scrollfrit HTML-baseret informationsdashboard i **Dark Celestial & Editorial**-stil, designet til fuldskærms Kiosk-mode på en Chromebook. Hostes direkte på Git og udrulles på Vercel.

---

## 🌟 Hovedfunktioner

1. **Præcist Realtids-Ur**:
   - Viser timer, minutter og sekunder i realtid.
   - Ugenummer og dansk datoformat (f.eks. *Fredag d. 11. september 2026*).
2. **Vejrudsigt & Solbane (Open-Meteo)**:
   - Aktuel temperatur, høj/lav, vind, luftfugtighed og nedbørschance (Aarhus / Østjylland standard med browser-geoplacering).
   - Dynamisk dagslysbue med solopgang og solnedgang samt tæller for resterende dagslys.
   - Næste 4 timers time-for-time mini-udsigt.
3. **Månefaser (Lunar Cycle)**:
   - Realistisk beregnet SVG-grafik med måneskygge.
   - Angiver belysningsgrad i procent, alder i dags-cyklus og det officielle danske fasenavn (*Fuldmåne*, *Voksende månesegl*, osv.).
4. **Tidens Arkiv (Wikipedia REST API)**:
   - Auto-roterende kort der blødt cykler mellem *Denne dag i historien* (historiske begivenheder) og *Mærkedage* (kendte personligheder født i dag).
5. **Nyhedspuls (RSS Feeds & Meningsmålinger)**:
   - Aggregerer 8 kuraterede kvalitetskilder samt politiske barometer-målinger:
     - **DR Seneste** & **DR Politik**
     - **Altinget** & **Politiken Politik**
     - **TV2 Østjylland**
     - **BBC World**, **France 24** & **Deutsche Welle**
     - **Voxmeter / Altinget** (Politiske meningsmålinger)
   - Automatisk roterende editorial tophistorie med kilde-badge, fotovisning og fremdriftsindikator.
   - Interaktiv kilde-filtrering og 2-spaltet overbliksstrøm med sideopdeling.
6. **Det Okkulte Spektrum**:
   - **Planetariske Timer**: Beregner de 12 ulige dagtimer og 12 nattimer efter den ægte hermetiske/chaldæiske orden styret af ugedagens planet og solens bane.
   - **Månens Zodiak**: Aktuelt stjernetegn for Månen og tegnets element (Ild, Jord, Luft, Vand).
   - **Void of Course Status**: Viser om Månen er i aktiv strøm eller i 'Void of Course'-fase.
   - **Dagens Kosmiske Resonans**: Mystisk indsigt i dagens energi.

---

## 🖥️ Kiosk-mode på Chromebook

Dashboardet er bygget specifikt til at eliminere scrollbarer og klikkrav:
- `100vw` / `100vh` låst viewport med `overflow: hidden`.
- Auto-roterende tickers (ingen klik nødvendigt).
- **Tastaturgenvej**: Tryk på **`F`** på Chromebooken for at gå i fuldskærm.
- **Ikon i toppen**: Klik på fuldskærmsikonet (⛶) øverst til højre.

### Sådan sættes Chromebooken op i permanent Kiosk:
1. **Mulighed 1 (Chrome URL Kiosk flag)**:
   - Åbn Chrome og naviger til dit udrullede Vercel-link.
   - Tryk `F4` (fuldskærmstasten øverst på Chromebook-tastaturet).
2. **Mulighed 2 (Installér som Web App)**:
   - Klik på de tre prikker i Chrome ➔ *Gem og del* ➔ *Opret genvej...* ➔ Sæt hak ved *Åbn som vindue*.
   - Fastgør appen til hylden på Chromebooken.

---

## 🚀 Kør lokalt

Projektet kræver ingen eksterne `npm install` pakker; det benytter moderne native ES Modules og Node.js:

```bash
npm start
# eller
node server.js
```

Åbn derefter [http://localhost:3000](http://localhost:3000) i din browser.

---

## ☁️ Deployment til Vercel & GitHub

1. **Initialisér Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Dark Celestial Kiosk Dashboard"
   ```
2. **Push til GitHub**:
   - Opret et nyt repository på GitHub og kør de viste instruktioner (`git remote add origin ...` og `git push -u origin main`).
3. **Deploy på Vercel**:
   - Gå til [vercel.com](https://vercel.com) og vælg *Add New Project*.
   - Vælg dit GitHub-repository.
   - Vercel genkender automatisk `vercel.json` og `/api/news.js`.
   - Klik **Deploy**.

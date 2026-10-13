# Kronika tridsiatej jesene

Narodeninový web pre Kiwi – jednostránková rozprávka, ktorá končí darom: rokom Con Morhenu 2027.

Čistý HTML + CSS + JS, bez build kroku. Všetko (GSAP, Three.js, písma) je priložené lokálne, takže web beží aj offline – jediné externé obrázky sú dva bannery z conmorhen.cz na vstupenkách.

## Spustenie lokálne

```bash
cd Kiwinka-page
python3 -m http.server 8000
# otvor http://localhost:8000
```

(Otvorenie `index.html` priamo zo súboru funguje tiež, ale písma sa v niektorých prehliadačoch načítajú len cez http.)

## Nasadenie na GitHub Pages

1. Vytvor nový repozitár na GitHube, napr. `kiwi-30`.
2. V priečinku projektu:
   ```bash
   git init
   git add .
   git commit -m "Kronika tridsiatej jesene"
   git branch -M main
   git remote add origin git@github.com:TVOJE-MENO/kiwi-30.git
   git push -u origin main
   ```
3. Na GitHube: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, Save.
4. O minútu beží na `https://TVOJE-MENO.github.io/kiwi-30/`.

Súbor `.nojekyll` je v repe preto, aby GitHub Pages nič nespracúval a servíroval súbory tak, ako sú.

## Čo sa oplatí upraviť

- **Termíny a miesta** – na začiatku `main.js` v objekte `CONFIG` (`ballDate`, `ballPlace`, `festDate`, `festPlace`).
- **Texty kapitol** – priamo v `index.html`, každá kapitola je jedna `<section class="chapter">`.
- **Obrázky vstupeniek** – v `index.html` hľadaj `ticket-img`. Ak chceš byť nezávislý od conmorhen.cz, stiahni si
  `https://conmorhen.cz/media/prod/ball_26.webp` a `https://conmorhen.cz/media/prod/cm_2026_banner.webp`
  do priečinka `assets/` a zmeň URL na `assets/ball_26.webp` a `assets/cm_2026_banner.webp`.
- **Podpis a dátum** – na konci `index.html` v `<p class="sign">`.

## Štruktúra

```
index.html   – obsah a štruktúra príbehu
style.css    – vzhľad, písma, animácie sviečky a pečate
main.js      – Three.js galaxia, popol, víla pri kurzore, GSAP scroll-animácie
vendor/      – gsap, ScrollTrigger, three (lokálne kópie)
fonts/       – Fraunces + Spectral (woff2)
```
# kiwinka-prianie
# kiwinka-prianie
# kiwinka-prianie

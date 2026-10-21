# Feniks Self-Service Car Wash

A bilingual website for Feniks, a family-owned self-service car wash in Novo Miloševo, Serbia. It shares visitor information, directions, pricing, and current local weather.

## Features

- English and Serbian (Latin and Cyrillic) interface with a three-option language switch
- Business hours, wash pricing, address, and directions
- Live local weather from the [Open-Meteo API](https://open-meteo.com/)
- Google Maps search/directions links, an embedded Google Map, and a supplementary location illustration
- Responsive pages with locally hosted fonts, images, and SVG icons
- Gallery photos are WebP; the 2022 construction photo is labeled accurately
- Search-engine and AI-readable business information in `llms.txt`
- Search metadata is provided in the HTML, with `sitemap.xml` referenced from `robots.txt`

## Run locally

No build step or package installation is required. With PowerShell, run the included local server from the project folder:

```powershell
.\serve.ps1
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000). Stop the server with `Ctrl+C`.

You can also serve the folder with another static HTTP server. Opening the HTML files directly may prevent browser features such as live weather from working as expected.

## Pages

- `index.html` — Home page, wash details, local forecast, and FAQs
- `contact.html` — Address, map, directions, contact placeholders, and contact form
- `thank-you.html` — Localized Netlify Forms submission confirmation

## Contact form

The contact form uses [Netlify Forms](https://docs.netlify.com/forms/setup/), including a honeypot and a bilingual thank-you page. It is detected and collects submissions when the site is deployed through Netlify; it will not process submissions when served locally or hosted on GitHub Pages. Configure email notifications in the Netlify Forms settings to receive submissions by email and send a real test submission after deployment.

## External services

- Weather data is requested from Open-Meteo at runtime and may be unavailable if the service or network cannot be reached.
- Map links and the embedded map are provided by Google Maps; the contact page also displays a static location illustration.
- The site uses local fonts from `assets/fonts/` and icons from `assets/icons.svg`; it does not request Google Fonts.

## Business information

Feniks is at Maršala Tita 70, 23273 Novo Miloševo, Serbia, across from Beodra Church, and is listed as open 24/7. One 100 RSD Žeton provides 132 seconds of washing. The site has three wash bays, including one for larger vehicles; tokens are sold at the kiosk, with cash and card accepted. Supported vehicles range from small cars to large tractors; animals and non-motorized vehicles are not allowed. The wash stays operational in freezing weather, but the ground outside the heated-floor bays may be slippery.

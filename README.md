# Feniks Self-Service Car Wash

A bilingual website for Feniks, a family-owned self-service car wash in Novo Miloševo, Serbia. It shares visitor information, directions, pricing, and current local weather.

## Features

- English and Serbian (Latin) interface with a language switch
- Business hours, wash pricing, address, and directions
- Live local weather from the [Open-Meteo API](https://open-meteo.com/)
- Google Maps directions and embedded map
- Responsive, accessible pages with locally hosted fonts and images
- Search-engine and AI-readable business information in `llms.txt`

## Run locally

No build step or package installation is required. With PowerShell, run the included local server from the project folder:

```powershell
.\serve.ps1
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000). Stop the server with `Ctrl+C`.

You can also serve the folder with another static HTTP server. Opening the HTML files directly may prevent browser features such as live weather from working as expected.

## Pages

- `index.html` — Home page, wash details, local forecast, and FAQs
- `contact.html` — Address, map, directions, and contact form

## Contact form

The contact form uses [Netlify Forms](https://docs.netlify.com/forms/setup/). It is detected and collects submissions when the site is deployed through Netlify; it will not process submissions when served locally or hosted on GitHub Pages. Enable form detection for the Netlify site and configure email notifications in its Forms settings to receive submissions by email. Verify the form with a test submission after deployment.

## External services

- Weather data is requested from Open-Meteo at runtime and may be unavailable if the service or network cannot be reached.
- Map links and the embedded map are provided by Google Maps.

## Business information

Feniks is at Maršala Tita 70, 23273 Novo Miloševo, Serbia, and is listed as open 24/7. One 100 RSD Žeton provides 132 seconds of washing. Check the website or its map link for visitor details.

const savedLanguage = (() => {
  try {
    return localStorage.getItem('greenline-language');
  } catch (error) {
    console.warn('Unable to read the saved language preference:', error);
    return null;
  }
})();
const supportedLanguages = ['en', 'sr-Latn', 'sr-Cyrl'];
const browserLanguage = navigator.language.toLowerCase();
let currentLanguage = supportedLanguages.includes(savedLanguage)
  ? savedLanguage
  : savedLanguage === 'sr' ? 'sr-Latn'
    : browserLanguage.startsWith('sr-cyrl') ? 'sr-Cyrl'
      : browserLanguage.startsWith('en') ? 'en' : 'sr-Latn';
let currentConditions;
let currentTemperatureCelsius = null;
let currentFeelsLikeCelsius = null;
let currentWindSpeedKmh = null;
let weatherTime;
let weatherLoading = true;
let weatherUnavailable = false;

const weather = {
  clear: { en: 'Clear sky', sr: 'Vedro', symbol: 'sun' },
  partly: { en: 'Partly cloudy', sr: 'Delimično oblačno', symbol: 'partly-cloudy' },
  cloudy: { en: 'Cloudy', sr: 'Oblačno', symbol: 'cloud' },
  fog: { en: 'Fog', sr: 'Magla', symbol: 'fog' },
  rain: { en: 'Rain', sr: 'Kiša', symbol: 'rain' },
  snow: { en: 'Snow', sr: 'Sneg', symbol: 'snow' },
  storm: { en: 'Thunderstorm', sr: 'Grmljavina', symbol: 'storm' }
};

function isSerbianLanguage(language = currentLanguage) {
  return language !== 'en';
}

function isSerbianCyrillic(language = currentLanguage) {
  return language === 'sr-Cyrl';
}

function toSerbianCyrillic(text) {
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(text)) return text;
  const preservedTokens = [];
  const protectedText = text.replace(/\bRSD\b|\b[A-Z0-9]{4,}\+[A-Z0-9]{2,}\b|TODO\(owner\)/g, (token) => {
    preservedTokens.push(token);
    return `\uE000${preservedTokens.length - 1}\uE001`;
  });
  const digraphs = { dž: 'џ', Dž: 'Џ', DŽ: 'Џ', lj: 'љ', Lj: 'Љ', LJ: 'Љ', nj: 'њ', Nj: 'Њ', NJ: 'Њ' };
  const letters = {
    a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е', f: 'ф', g: 'г',
    h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
    q: 'к', s: 'с', š: 'ш', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс', y: 'и', z: 'з', ž: 'ж',
    A: 'А', B: 'Б', C: 'Ц', Č: 'Ч', Ć: 'Ћ', D: 'Д', Đ: 'Ђ', E: 'Е', F: 'Ф', G: 'Г',
    H: 'Х', I: 'И', J: 'Ј', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П', Q: 'К',
    R: 'Р', S: 'С', Š: 'Ш', T: 'Т', U: 'У', V: 'В', W: 'В', X: 'Кс', Y: 'И', Z: 'З', Ž: 'Ж'
  };
  return protectedText
    .replace(/dž|Dž|DŽ|lj|Lj|LJ|nj|Nj|NJ/g, (digraph) => digraphs[digraph])
    .replace(/[a-zA-ZčćđšžČĆĐŠŽ]/g, (letter) => letters[letter])
    .replace(/\uE000(\d+)\uE001/g, (_, tokenIndex) => preservedTokens[Number(tokenIndex)]);
}

function localizedSerbian(text) {
  return isSerbianCyrillic() ? toSerbianCyrillic(text) : text;
}

function renderWeatherLanguage() {
  const description = document.querySelector('#weather-description');
  if (!description) return;

  description.textContent = weatherUnavailable
    ? (isSerbianLanguage() ? localizedSerbian('Vreme trenutno nije dostupno.') : 'Weather is unavailable right now.')
    : currentConditions
      ? (isSerbianLanguage() ? localizedSerbian(currentConditions.sr) : currentConditions.en)
      : (isSerbianLanguage() ? localizedSerbian('Učitavanje vremena…') : 'Loading weather…');

  const updated = document.querySelector('#weather-updated');
  if (updated) {
    if (weatherUnavailable) {
      updated.textContent = isSerbianLanguage() ? localizedSerbian('Trenutni uslovi nisu dostupni.') : 'Current conditions are unavailable.';
    } else if (weatherTime) {
      const locale = currentLanguage === 'sr-Cyrl' ? 'sr-Cyrl-RS' : currentLanguage === 'sr-Latn' ? 'sr-Latn-RS' : 'en-GB';
      const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' }).format(weatherTime);
      updated.textContent = `${isSerbianLanguage() ? localizedSerbian('Ažurirano') : 'Updated'} ${time}`;
    } else if (weatherLoading) {
      updated.textContent = isSerbianLanguage() ? localizedSerbian('Proveravamo trenutne uslove…') : 'Checking current conditions…';
    }
  }
}

function renderWindSpeed() {
  const wind = document.querySelector('#weather-wind');
  if (!wind) return;
  if (currentWindSpeedKmh === null) {
    wind.textContent = '-- km/h';
    return;
  }
  wind.textContent = `${Math.round(currentWindSpeedKmh)} km/h`;
}

function renderTemperatures() {
  const format = (celsius) => celsius === null ? '--°C' : `${Math.round(celsius)}°C`;
  const temperature = document.querySelector('#weather-temperature');
  const feelsLike = document.querySelector('#weather-feels');
  if (temperature) temperature.textContent = format(currentTemperatureCelsius);
  if (feelsLike) feelsLike.textContent = format(currentFeelsLikeCelsius);
}

function weatherForCode(code) {
  if (code === 0) return weather.clear;
  if (code === 1 || code === 2) return weather.partly;
  if (code === 3) return weather.cloudy;
  if (code === 45 || code === 48) return weather.fog;
  if (code >= 51 && code <= 67 || code >= 80 && code <= 82) return weather.rain;
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return weather.snow;
  if (code >= 95) return weather.storm;
  return weather.cloudy;
}

async function loadWeather() {
  if (!document.querySelector('#weather-temperature')) return;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const params = new URLSearchParams({
      latitude: '45.73',
      longitude: '20.30',
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      timezone: 'Europe/Belgrade'
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Weather request failed with HTTP ${response.status}`);

    const data = await response.json();
    const current = data.current;
    const values = [
      current?.temperature_2m,
      current?.apparent_temperature,
      current?.relative_humidity_2m,
      current?.weather_code,
      current?.wind_speed_10m
    ];
    const timestamp = new Date(current?.time);
    if (!values.every(Number.isFinite) || Number.isNaN(timestamp.getTime())) {
      throw new Error('Weather response contained invalid current conditions');
    }

    currentTemperatureCelsius = current.temperature_2m;
    currentFeelsLikeCelsius = current.apparent_temperature;
    currentConditions = weatherForCode(current.weather_code);
    weatherTime = timestamp;
    document.querySelector('#weather-symbol use').setAttribute('href', `assets/icons.svg#${currentConditions.symbol}`);
    currentWindSpeedKmh = current.wind_speed_10m;
    document.querySelector('#weather-humidity').textContent = `${current.relative_humidity_2m}%`;
  } catch (error) {
    console.error('Unable to load live weather:', error);
    weatherUnavailable = true;
    currentTemperatureCelsius = null;
    currentFeelsLikeCelsius = null;
    currentWindSpeedKmh = null;
    document.querySelector('#weather-symbol use').setAttribute('href', 'assets/icons.svg#weather-unavailable');
    document.querySelector('#weather-humidity').textContent = '--%';
  } finally {
    window.clearTimeout(timeout);
    weatherLoading = false;
    renderTemperatures();
    renderWindSpeed();
    renderWeatherLanguage();
  }
}

function applyLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  const translationLanguage = isSerbianLanguage(language) ? 'sr' : 'en';
  const translate = (text) => isSerbianCyrillic(language) ? toSerbianCyrillic(text) : text;
  document.querySelectorAll('meta[name="description"][data-description-en][data-description-sr]').forEach((meta) => {
    meta.setAttribute('content', translate(meta.getAttribute(`data-description-${translationLanguage}`)));
  });
  document.querySelectorAll('meta[data-meta-en][data-meta-sr]').forEach((meta) => {
    meta.setAttribute('content', translate(meta.getAttribute(`data-meta-${translationLanguage}`)));
  });
  document.querySelectorAll('[data-en][data-sr]').forEach((element) => {
    element.textContent = translate(element.dataset[translationLanguage]);
  });
  document.querySelectorAll('[data-placeholder-en][data-placeholder-sr]').forEach((element) => {
    element.placeholder = translate(element.getAttribute(`data-placeholder-${translationLanguage}`));
  });
  document.querySelectorAll('[data-title-en][data-title-sr]').forEach((element) => {
    element.title = translate(element.getAttribute(`data-title-${translationLanguage}`));
  });
  document.querySelectorAll('[data-aria-en][data-aria-sr]').forEach((element) => {
    element.setAttribute('aria-label', translate(element.getAttribute(`data-aria-${translationLanguage}`)));
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  document.querySelectorAll('#message-form input, #message-form select, #message-form textarea').forEach((field) => {
    field.setCustomValidity('');
  });
  try {
    localStorage.setItem('greenline-language', language);
  } catch (error) {
    console.warn('Unable to save the language preference:', error);
  }
  renderTemperatures();
  renderWindSpeed();
  renderWeatherLanguage();
}

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});

const messageForm = document.querySelector('#message-form');
messageForm?.addEventListener('invalid', (event) => {
  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
  if (field.validity.valueMissing) {
    field.setCustomValidity(isSerbianLanguage() ? localizedSerbian('Popunite ovo polje.') : 'Please complete this field.');
  } else if (field.validity.typeMismatch && field.type === 'email') {
    field.setCustomValidity(isSerbianLanguage() ? localizedSerbian('Unesite ispravnu imejl adresu.') : 'Enter a valid email address.');
  }
}, true);
messageForm?.querySelectorAll('input, select, textarea').forEach((field) => {
  field.addEventListener('input', () => field.setCustomValidity(''));
  field.addEventListener('change', () => field.setCustomValidity(''));
});

const tickerGroup = document.querySelector('.ticker-group');
if (tickerGroup) {
  const phraseSet = Array.from(tickerGroup.children);
  for (let copyIndex = 1; copyIndex < 12; copyIndex += 1) {
    phraseSet.forEach((element) => {
      const copy = element.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('*').forEach((child) => child.setAttribute('aria-hidden', 'true'));
      tickerGroup.append(copy);
    });
  }
  const tickerClone = tickerGroup.cloneNode(true);
  tickerClone.setAttribute('aria-hidden', 'true');
  tickerClone.querySelectorAll('[aria-hidden]').forEach((element) => element.setAttribute('aria-hidden', 'true'));
  tickerGroup.parentElement.append(tickerClone);
  tickerGroup.parentElement.classList.add('ticker-ready');
}

function initializeMotionDesign() {
  const hero = document.querySelector('.hero');
  const heroImage = hero?.querySelector('.hero-image');
  const heroStamp = hero?.querySelector('.hero-stamp');

  if (hero && heroImage && heroStamp) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const properties = {
      imageX: '--hero-image-x',
      imageY: '--hero-image-y',
      stampX: '--hero-stamp-x',
      stampY: '--hero-stamp-y'
    };
    const target = { imageX: 0, imageY: 0, stampX: 0, stampY: 0 };
    const current = { ...target };
    let animationFrame = 0;
    let previousFrameTime = 0;
    let resetAfterAnimation = false;

    function animateHeroParallax(timestamp) {
      animationFrame = 0;
      const easing = 1 - Math.exp(-(timestamp - previousFrameTime) / 90);
      previousFrameTime = timestamp;
      let settled = true;

      Object.entries(properties).forEach(([key, property]) => {
        current[key] += (target[key] - current[key]) * easing;
        if (Math.abs(target[key] - current[key]) > 0.01) settled = false;
        hero.style.setProperty(property, `${current[key]}px`);
      });

      if (!settled) {
        animationFrame = window.requestAnimationFrame(animateHeroParallax);
      } else if (resetAfterAnimation) {
        Object.values(properties).forEach((property) => hero.style.removeProperty(property));
        resetAfterAnimation = false;
      }
    }

    function scheduleHeroParallax(reset = false) {
      resetAfterAnimation = reset;
      if (!animationFrame) {
        previousFrameTime = performance.now();
        animationFrame = window.requestAnimationFrame(animateHeroParallax);
      }
    }

    hero.addEventListener('pointermove', (event) => {
      if (reducedMotion || event.pointerType === 'touch') return;
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      target.imageX = -x * 8;
      target.imageY = -y * 6;
      target.stampX = -x * 5;
      target.stampY = -y * 4;
      scheduleHeroParallax();
    });

    hero.addEventListener('pointerleave', () => {
      if (reducedMotion) return;
      Object.keys(target).forEach((key) => { target[key] = 0; });
      scheduleHeroParallax(true);
    });
  }

  const revealTargets = document.querySelectorAll([
    '.hero-stamp',
    '.hero-bottom',
    '.weather-intro',
    '.weather-current',
    '.weather-detail',
    '.section-heading',
    '.service-item',
    '.location-copy',
    '.location-address',
    '.location-index',
    '.contact-intro > div',
    '.contact-intro-note',
    '.form-panel',
    '.address-panel',
    '.map-embed',
    '.map-illustration'
  ].join(', '));

  if ('IntersectionObserver' in window && revealTargets.length) {
    let scrollRevealsStarted = false;
    const startScrollReveals = () => {
      if (scrollRevealsStarted) return;
      scrollRevealsStarted = true;
      document.documentElement.classList.add('motion-ready');
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

      revealTargets.forEach((element) => {
        element.classList.add('motion-reveal');
        revealObserver.observe(element);
      });
    };

    window.addEventListener('wheel', startScrollReveals, { once: true, passive: true });
    window.addEventListener('touchmove', startScrollReveals, { once: true, passive: true });
    window.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) startScrollReveals();
    });
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', startScrollReveals, { once: true });
    });
  }

  const navigation = document.querySelector('.main-nav');
  const homeLink = navigation?.querySelector('a[href="index.html"]');
  if (!('IntersectionObserver' in window) || !homeLink || !hero) return;

  const sectionLinks = [
    { section: hero, link: homeLink },
    { section: document.querySelector('#weather'), link: navigation.querySelector('a[href="#weather"]') },
    { section: document.querySelector('#services'), link: navigation.querySelector('a[href="#services"]') },
    { section: document.querySelector('.location-strip'), link: homeLink }
  ].filter(({ section, link }) => section && link);

  const contextObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const currentLink = sectionLinks.find(({ section }) => section === entry.target)?.link;
      if (!currentLink) return;
      navigation.querySelectorAll('a').forEach((link) => {
        const isCurrent = link === currentLink;
        link.classList.toggle('active', isCurrent);
        if (isCurrent) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

  sectionLinks.forEach(({ section }) => contextObserver.observe(section));
}

applyLanguage(currentLanguage);
initializeMotionDesign();
loadWeather();

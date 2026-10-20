const savedLanguage = localStorage.getItem('greenline-language');
let currentLanguage = savedLanguage === 'en' ? 'en' : 'sr';
let formSubmitted = false;
let currentConditions;
let currentTemperatureCelsius = null;
let currentFeelsLikeCelsius = null;
let currentWindSpeedKmh = null;
let weatherTime;
let weatherLoading = true;
let weatherUnavailable = false;

const weather = {
  clear: { en: 'Clear sky', sr: 'Vedro', symbol: '☀' },
  partly: { en: 'Partly cloudy', sr: 'Delimično oblačno', symbol: '◐' },
  cloudy: { en: 'Cloudy', sr: 'Oblačno', symbol: '☁' },
  fog: { en: 'Fog', sr: 'Magla', symbol: '≋' },
  rain: { en: 'Rain', sr: 'Kiša', symbol: '☂' },
  snow: { en: 'Snow', sr: 'Sneg', symbol: '❄' },
  storm: { en: 'Thunderstorm', sr: 'Grmljavina', symbol: 'ϟ' }
};

function renderWeatherLanguage() {
  const description = document.querySelector('#weather-description');
  if (!description) return;

  description.textContent = weatherUnavailable
    ? (currentLanguage === 'sr' ? 'Vreme trenutno nije dostupno' : 'Weather unavailable')
    : currentConditions
      ? currentConditions[currentLanguage]
      : (currentLanguage === 'sr' ? 'Učitavanje vremena' : 'Loading weather');

  const updated = document.querySelector('#weather-updated');
  if (updated) {
    if (weatherUnavailable) {
      updated.textContent = currentLanguage === 'sr' ? 'Prognoza trenutno nije dostupna.' : 'Live forecast could not be loaded.';
    } else if (weatherTime) {
      const locale = currentLanguage === 'sr' ? 'sr-Latn-RS' : 'en-GB';
      const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' }).format(weatherTime);
      updated.textContent = `${currentLanguage === 'sr' ? 'Ažurirano' : 'Updated'} ${time}`;
    } else if (weatherLoading) {
      updated.textContent = currentLanguage === 'sr' ? 'Proveravamo trenutne uslove…' : 'Checking current conditions…';
    }
  }
}

function renderWindSpeed() {
  const wind = document.querySelector('#weather-wind');
  if (!wind) return;
  if (currentWindSpeedKmh === null) {
    wind.textContent = '--';
    return;
  }
  wind.textContent = currentLanguage === 'sr'
    ? `${Math.round(currentWindSpeedKmh)} km/h`
    : `${Math.round(currentWindSpeedKmh * 0.621371)} mph`;
}

function renderTemperatures() {
  const unit = currentLanguage === 'sr' ? '°C' : '°F';
  const format = (celsius) => celsius === null
    ? `--${unit}`
    : `${Math.round(currentLanguage === 'sr' ? celsius : celsius * 9 / 5 + 32)}${unit}`;
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

  try {
    const params = new URLSearchParams({
      latitude: '45.73',
      longitude: '20.30',
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      temperature_unit: 'celsius',
      timezone: 'Europe/Belgrade'
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(10000)
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
    document.querySelector('#weather-symbol').textContent = currentConditions.symbol;
    currentWindSpeedKmh = current.wind_speed_10m;
    document.querySelector('#weather-humidity').textContent = `${current.relative_humidity_2m}%`;
  } catch (error) {
    console.error('Unable to load live weather:', error);
    weatherUnavailable = true;
    currentTemperatureCelsius = null;
    currentFeelsLikeCelsius = null;
    currentWindSpeedKmh = null;
    document.querySelector('#weather-symbol').textContent = '—';
    document.querySelector('#weather-humidity').textContent = '--%';
  } finally {
    weatherLoading = false;
    renderTemperatures();
    renderWindSpeed();
    renderWeatherLanguage();
  }
}

function applyLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language === 'sr' ? 'sr-Latn' : 'en';
  document.querySelectorAll('meta[name="description"][data-description-en][data-description-sr]').forEach((meta) => {
    meta.setAttribute('content', meta.getAttribute(`data-description-${language}`));
  });
  document.querySelectorAll('[data-en][data-sr]').forEach((element) => {
    element.textContent = element.dataset[language];
  });
  document.querySelectorAll('[data-placeholder-en][data-placeholder-sr]').forEach((element) => {
    element.placeholder = element.getAttribute(`data-placeholder-${language}`);
  });
  document.querySelectorAll('[data-title-en][data-title-sr]').forEach((element) => {
    element.title = element.getAttribute(`data-title-${language}`);
  });
  document.querySelectorAll('[data-aria-en][data-aria-sr]').forEach((element) => {
    element.setAttribute('aria-label', element.getAttribute(`data-aria-${language}`));
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  const status = document.querySelector('#form-status');
  if (status && formSubmitted) {
    status.textContent = language === 'sr'
      ? 'Hvala na poruci. Ovaj demo obrazac proverava unos, ali još ne šalje niti čuva poruke.'
      : 'Thanks for reaching out. This demo form is validated, but messages are not sent or stored yet.';
  }
  localStorage.setItem('greenline-language', language);
  renderTemperatures();
  renderWindSpeed();
  renderWeatherLanguage();
}

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});

function initializeMotionDesign() {
  const hero = document.querySelector('.hero');
  const heroImage = hero?.querySelector('.hero-image');
  const heroCopy = hero?.querySelector('.hero-copy');
  const heroStamp = hero?.querySelector('.hero-stamp');

  if (hero && heroImage && heroCopy && heroStamp) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const properties = {
      imageX: '--hero-image-x',
      imageY: '--hero-image-y',
      copyX: '--hero-copy-x',
      copyY: '--hero-copy-y',
      stampX: '--hero-stamp-x',
      stampY: '--hero-stamp-y'
    };
    const target = { imageX: 0, imageY: 0, copyX: 0, copyY: 0, stampX: 0, stampY: 0 };
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
      target.copyX = x * 3;
      target.copyY = y * 2;
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

const messageForm = document.querySelector('#message-form');
if (messageForm) {
  messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!messageForm.reportValidity()) return;
    formSubmitted = true;
    applyLanguage(currentLanguage);
    messageForm.reset();
  });
}

applyLanguage(currentLanguage);
initializeMotionDesign();
loadWeather();

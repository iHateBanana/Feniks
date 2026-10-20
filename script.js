const savedLanguage = localStorage.getItem('greenline-language');
let currentLanguage = savedLanguage === 'en' ? 'en' : 'sr';
let formSubmitted = false;

function renderWeatherLanguage() {
  const description = document.querySelector('#weather-description');
  if (!description) return;

  description.textContent = currentLanguage === 'sr' ? 'Lokalni prikaz' : 'Offline preview';

  const updated = document.querySelector('#weather-updated');
  if (updated) {
    updated.textContent = currentLanguage === 'sr'
      ? 'Prognoza uživo nije dostupna u lokalnoj verziji.'
      : 'Live forecast is not available in the local version.';
  }
}

function renderTemperatures() {
  const unit = currentLanguage === 'sr' ? '°C' : '°F';
  const temperature = document.querySelector('#weather-temperature');
  const feelsLike = document.querySelector('#weather-feels');
  if (temperature) temperature.textContent = `--${unit}`;
  if (feelsLike) feelsLike.textContent = `--${unit}`;
}

function applyLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language === 'sr' ? 'sr-Latn' : 'en';
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
  renderWeatherLanguage();
}

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});

function initializeHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

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

initializeHeroParallax();
applyLanguage(currentLanguage);

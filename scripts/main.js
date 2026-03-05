const yearNode = document.querySelector('#current-year');
const imageStoryMedia = document.querySelector('.image-story-media');
const topLinks = Array.from(document.querySelectorAll('.top-nav a[href^="#"]'));
const scrollSections = Array.from(document.querySelectorAll('section[data-scroll-section], footer[data-scroll-section]'));
const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));
const heroSection = document.querySelector('.hero');
const imageStorySection = document.querySelector('.image-story');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = motionQuery.matches;

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (imageStoryMedia) {
  imageStoryMedia.addEventListener('error', () => {
    imageStoryMedia.style.display = 'none';
  });
}

const applyMotionMode = () => {
  reduceMotion = motionQuery.matches;
  document.documentElement.classList.toggle('motion-safe', !reduceMotion);

  if (reduceMotion) {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }
};

applyMotionMode();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const setActiveLink = (id) => {
  topLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
      return;
    }

    link.removeAttribute('aria-current');
  });
};

if (revealTargets.length > 0) {
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.22, rootMargin: '0px 0px -10% 0px' },
    );

    revealTargets.forEach((target) => revealObserver.observe(target));
  }
}

const updateScrollEffects = () => {
  const viewportHeight = window.innerHeight || 1;
  const scrollable = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
  const pageProgress = clamp(window.scrollY / scrollable, 0, 1);
  document.documentElement.style.setProperty('--scroll-progress', pageProgress.toFixed(4));

  let activeSectionId = '';
  let closestDistance = Number.POSITIVE_INFINITY;

  scrollSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionProgress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height), 0, 1);
    const sectionCenter = rect.top + rect.height * 0.5;
    const focusLine = viewportHeight * 0.45;
    const onScreen = rect.bottom > viewportHeight * 0.15 && rect.top < viewportHeight * 0.85;
    const distance = Math.abs(sectionCenter - focusLine);

    section.style.setProperty('--section-progress', sectionProgress.toFixed(4));
    section.classList.toggle('is-past', rect.bottom <= viewportHeight * 0.35);
    section.classList.toggle('is-future', rect.top >= viewportHeight * 0.65);

    if (onScreen && distance < closestDistance) {
      closestDistance = distance;
      activeSectionId = section.id;
    }
  });

  if (activeSectionId && topLinks.some((link) => link.getAttribute('href') === `#${activeSectionId}`)) {
    setActiveLink(activeSectionId);
  }

  if (!reduceMotion && heroSection) {
    const rect = heroSection.getBoundingClientRect();
    const shift = clamp(-rect.top * 0.035, -18, 26);
    heroSection.style.setProperty('--hero-shift', `${shift.toFixed(2)}px`);
  }

  if (!reduceMotion && imageStorySection) {
    const rect = imageStorySection.getBoundingClientRect();
    const shift = clamp(-rect.top * 0.018, -14, 22);
    imageStorySection.style.setProperty('--story-shift', `${shift.toFixed(2)}px`);
  }
};

let ticking = false;

const onScroll = () => {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(() => {
    updateScrollEffects();
    ticking = false;
  });
};

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);

const onMotionPreferenceChange = () => {
  applyMotionMode();
  updateScrollEffects();
};

if (typeof motionQuery.addEventListener === 'function') {
  motionQuery.addEventListener('change', onMotionPreferenceChange);
} else if (typeof motionQuery.addListener === 'function') {
  motionQuery.addListener(onMotionPreferenceChange);
}

updateScrollEffects();

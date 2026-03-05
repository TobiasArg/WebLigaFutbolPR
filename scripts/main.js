const yearNode = document.querySelector('#current-year');
const imageStoryMedia = document.querySelector('.image-story-media');
const topLinks = Array.from(document.querySelectorAll('.top-nav a[href^="#"]'));
const scrollSections = Array.from(document.querySelectorAll('section[data-scroll-section], footer[data-scroll-section]'));
const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));
const heroSection = document.querySelector('.hero');
const imageStorySection = document.querySelector('.image-story');
const momentsGrid = document.querySelector('.moments-grid');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const hoverPreviewQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
let reduceMotion = motionQuery.matches;
let previewBackdrop = null;
let previewImage = null;
let previewActiveTile = null;
let previewTimer = 0;

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

const clearPreviewTimer = () => {
  if (!previewTimer) {
    return;
  }

  window.clearTimeout(previewTimer);
  previewTimer = 0;
};

const ensureMomentsPreviewNodes = () => {
  if (previewBackdrop && previewImage) {
    return;
  }

  previewBackdrop = document.createElement('div');
  previewBackdrop.className = 'moments-preview-backdrop';
  previewBackdrop.setAttribute('aria-hidden', 'true');

  previewImage = document.createElement('img');
  previewImage.className = 'moments-preview-image';
  previewImage.setAttribute('aria-hidden', 'true');
  previewImage.decoding = 'async';

  document.body.append(previewBackdrop, previewImage);
};

const getTileImage = (tile) => tile?.querySelector('img') || null;

const getTileImageRect = (tile) => {
  const image = getTileImage(tile);

  if (!image) {
    return null;
  }

  return image.getBoundingClientRect();
};

const setPreviewBaseSize = (rect) => {
  if (!previewImage || !rect) {
    return;
  }

  previewImage.style.width = `${rect.width}px`;
  previewImage.style.height = `${rect.height}px`;
};

const applyPreviewTransform = (originRect, targetRect) => {
  if (!previewImage || !originRect || !targetRect) {
    return;
  }

  const safeOriginWidth = Math.max(originRect.width, 1);
  const scale = targetRect.width / safeOriginWidth;
  previewImage.style.transform = `translate3d(${targetRect.left}px, ${targetRect.top}px, 0) scale(${scale})`;
};

const animatePreviewToRect = (tile, originRect, targetRect) => {
  if (!previewImage || !originRect || !targetRect) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (previewActiveTile !== tile || !previewImage.classList.contains('is-active')) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (previewActiveTile !== tile || !previewImage.classList.contains('is-active')) {
        return;
      }

      applyPreviewTransform(originRect, targetRect);
    });
  });
};

const getCenteredPreviewRect = (originRect) => {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const growthFactor = 1.3;
  let width = originRect.width * growthFactor;
  let height = originRect.height * growthFactor;

  const fitFactor = Math.min(1, (viewportWidth * 0.92) / width, (viewportHeight * 0.88) / height);
  width *= fitFactor;
  height *= fitFactor;

  return {
    width,
    height,
    left: (viewportWidth - width) * 0.5,
    top: (viewportHeight - height) * 0.5,
  };
};

const cleanupMomentsPreview = () => {
  if (!previewImage || !previewBackdrop) {
    return;
  }

  previewImage.classList.remove('is-active');
  previewBackdrop.classList.remove('is-active');
  previewImage.removeAttribute('src');
  previewImage.removeAttribute('alt');
};

const hideMomentsPreview = (instant = false) => {
  if (!previewActiveTile || !previewImage || !previewBackdrop) {
    return;
  }

  clearPreviewTimer();

  const activeTile = previewActiveTile;
  const originRect = getTileImageRect(activeTile);
  previewActiveTile = null;
  previewBackdrop.classList.remove('is-active');

  if (instant || reduceMotion || !originRect) {
    cleanupMomentsPreview();
    return;
  }

  setPreviewBaseSize(originRect);
  applyPreviewTransform(originRect, originRect);

  previewTimer = window.setTimeout(() => {
    cleanupMomentsPreview();
    clearPreviewTimer();
  }, 600);
};

const showMomentsPreview = (tile) => {
  if (!hoverPreviewQuery.matches || !tile) {
    return;
  }

  const image = getTileImage(tile);

  if (!image) {
    return;
  }

  ensureMomentsPreviewNodes();
  clearPreviewTimer();

  previewActiveTile = tile;

  const originRect = image.getBoundingClientRect();
  const centeredRect = getCenteredPreviewRect(originRect);

  previewImage.src = image.currentSrc || image.src;
  previewImage.alt = image.alt || '';
  previewImage.style.objectPosition = window.getComputedStyle(image).objectPosition;

  setPreviewBaseSize(originRect);
  applyPreviewTransform(originRect, originRect);
  previewImage.classList.add('is-active');
  previewBackdrop.classList.add('is-active');

  if (reduceMotion) {
    applyPreviewTransform(originRect, centeredRect);
    return;
  }

  animatePreviewToRect(tile, originRect, centeredRect);
};

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

if (momentsGrid) {
  momentsGrid.addEventListener('pointerover', (event) => {
    if (!hoverPreviewQuery.matches) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const tile = target.closest('.moments-tile');

    if (!tile || !momentsGrid.contains(tile) || tile === previewActiveTile) {
      return;
    }

    showMomentsPreview(tile);
  });

  momentsGrid.addEventListener('pointerout', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const tile = target.closest('.moments-tile');

    if (!tile || !momentsGrid.contains(tile)) {
      return;
    }

    const related = event.relatedTarget;

    if (related instanceof Element) {
      const nextTile = related.closest('.moments-tile');

      if (nextTile && momentsGrid.contains(nextTile)) {
        return;
      }
    }

    if (previewActiveTile === tile) {
      hideMomentsPreview();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideMomentsPreview(true);
    }
  });
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
  if (previewActiveTile) {
    hideMomentsPreview(true);
  }

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
window.addEventListener('resize', () => {
  hideMomentsPreview(true);
  onScroll();
});

const onMotionPreferenceChange = () => {
  hideMomentsPreview(true);
  applyMotionMode();
  updateScrollEffects();
};

if (typeof motionQuery.addEventListener === 'function') {
  motionQuery.addEventListener('change', onMotionPreferenceChange);
} else if (typeof motionQuery.addListener === 'function') {
  motionQuery.addListener(onMotionPreferenceChange);
}

if (typeof hoverPreviewQuery.addEventListener === 'function') {
  hoverPreviewQuery.addEventListener('change', () => {
    hideMomentsPreview(true);
  });
} else if (typeof hoverPreviewQuery.addListener === 'function') {
  hoverPreviewQuery.addListener(() => {
    hideMomentsPreview(true);
  });
}

updateScrollEffects();

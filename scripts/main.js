const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const yearNode = document.querySelector('#current-year');

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('is-open', !expanded);
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('is-open');
    });
  });
}

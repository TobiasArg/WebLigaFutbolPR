const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const yearNode = document.querySelector('#current-year');

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (menuButton && mainNav) {
  const setMenuState = (isOpen) => {
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menu' : 'Abrir menu');
    mainNav.classList.toggle('is-open', isOpen);
  };

  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    setMenuState(!expanded);
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  setMenuState(false);
}

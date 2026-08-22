/* =========================================================
   ALMA RENT A CAR — Main JavaScript
   Navigation, scroll animations, and UI interactions
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initScrollReveal();
  initSmoothScroll();
  initCurrentYear();
});

/* ── HEADER SCROLL EFFECT ── */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const checkScroll = () => {
    if (window.scrollY > 80) {
      header.classList.add('header--scrolled');
      header.classList.remove('header--transparent');
    } else {
      header.classList.remove('header--scrolled');
      if (header.dataset.transparent === 'true') {
        header.classList.add('header--transparent');
      }
    }
  };

  checkScroll();
  window.addEventListener('scroll', checkScroll, { passive: true });
}

/* ── MOBILE MENU ── */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navOverlay = document.querySelector('.nav-overlay');

  if (!hamburger || !navMenu) return;

  const toggleMenu = () => {
    const isOpen = navMenu.classList.toggle('active');
    if (navOverlay) navOverlay.classList.toggle('active');
    document.body.classList.toggle('menu-open', isOpen);

    const icon = hamburger.querySelector('i');
    if (isOpen) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
      document.body.style.overflow = 'hidden';
    } else {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
      document.body.style.overflow = '';
    }
  };

  hamburger.addEventListener('click', toggleMenu);

  if (navOverlay) {
    navOverlay.addEventListener('click', toggleMenu);
  }

  // Close on link click
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) {
        toggleMenu();
      }
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
      toggleMenu();
    }
  });
}

/* ── SCROLL REVEAL ANIMATIONS ── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ── SMOOTH SCROLL ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ── COPYRIGHT YEAR ── */
function initCurrentYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* ── FAQ ACCORDION ── */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
      });

      // Toggle current
      if (!wasOpen) {
        item.classList.add('open');
      }
    });
  });
}

// Init FAQ if present
document.addEventListener('DOMContentLoaded', initFAQ);

/* ── ACTIVE NAV LINK ── */
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}
document.addEventListener('DOMContentLoaded', setActiveNavLink);

/* ── CARRUSEL (scroll-snap + flechas + puntos + autoplay) ── */
function initCarousels() {
  document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const prevBtn = carousel.querySelector('.carousel-arrow--prev');
    const nextBtn = carousel.querySelector('.carousel-arrow--next');
    const dotsWrap = carousel.querySelector('.carousel-dots');
    const items = track ? [...track.querySelectorAll('.carousel-item')] : [];
    if (!track || !items.length) return;

    const currentIndex = () => {
      let closest = 0;
      let closestDist = Infinity;
      items.forEach((item, i) => {
        const dist = Math.abs(item.offsetLeft - track.scrollLeft);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      return closest;
    };

    const goTo = (index) => {
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      track.scrollTo({ left: items[clamped].offsetLeft, behavior: 'smooth' });
    };

    // Puntos indicadores
    const dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ir al elemento ${i + 1}`);
        dot.addEventListener('click', () => {
          goTo(i);
          pauseAutoplay();
          scheduleResume();
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    const updateUI = () => {
      const maxScroll = track.scrollWidth - track.clientWidth - 2;
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled = track.scrollLeft >= maxScroll;
      const idx = currentIndex();
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };

    prevBtn?.addEventListener('click', () => {
      goTo(currentIndex() - 1);
      pauseAutoplay();
      scheduleResume();
    });
    nextBtn?.addEventListener('click', () => {
      goTo(currentIndex() + 1);
      pauseAutoplay();
      scheduleResume();
    });
    track.addEventListener('scroll', updateUI, { passive: true });
    window.addEventListener('resize', updateUI);

    // Autoplay: se pausa al interactuar y retoma tras un momento de inactividad
    const intervalMs = parseInt(carousel.dataset.autoplay, 10);
    let autoplayTimer = null;
    let resumeTimer = null;

    const stopAutoplay = () => {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = null;
    };
    const startAutoplay = () => {
      if (!intervalMs || items.length < 2) return;
      stopAutoplay();
      autoplayTimer = setInterval(() => {
        const next = currentIndex() + 1 >= items.length ? 0 : currentIndex() + 1;
        goTo(next);
      }, intervalMs);
    };
    const pauseAutoplay = () => {
      stopAutoplay();
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const scheduleResume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(startAutoplay, 5000);
    };

    carousel.addEventListener('mouseenter', pauseAutoplay);
    carousel.addEventListener('mouseleave', scheduleResume);
    carousel.addEventListener('touchstart', () => {
      pauseAutoplay();
      scheduleResume();
    }, { passive: true });

    updateUI();
    startAutoplay();
  });
}
document.addEventListener('DOMContentLoaded', initCarousels);

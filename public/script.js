/* ============================================
   Simple Wealth — Main Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Sticky Nav --- */
  const nav = document.querySelector('.nav');
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* --- Mobile Menu --- */
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a:not(.mobile-sub-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });

    /* Mobile sub-menu toggle */
    mobileMenu.querySelectorAll('.mobile-sub-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const sub = toggle.nextElementSibling;
        if (sub) sub.classList.toggle('open');
        toggle.classList.toggle('open');
      });
    });
  }

  /* --- Desktop Dropdown --- */
  const dropdown = document.querySelector('.nav__dropdown');
  if (dropdown) {
    const trigger = dropdown.querySelector('.nav__dropdown-trigger');

    const openDropdown = () => {
      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    const closeDropdown = () => {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.classList.contains('open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (dropdown.classList.contains('open')) {
          closeDropdown();
        } else {
          openDropdown();
        }
      } else if (e.key === 'Escape' && dropdown.classList.contains('open')) {
        closeDropdown();
        trigger.focus();
      }
    });

    dropdown.querySelector('.nav__dropdown-menu').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDropdown();
        trigger.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  /* --- FAQ Accordion --- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      /* Close all in same list */
      item.closest('.faq-list').querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
      });

      if (!wasOpen) item.classList.add('open');
    });
  });

  /* --- Scroll Fade-in Animation --- */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(el => observer.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* --- Testimonial Carousel (supports multiple instances) --- */
  document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel__track');

    /* Shuffle slides on each page load */
    const slidesArray = Array.from(track.children);
    for (let i = slidesArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      track.appendChild(slidesArray[j]);
    }
    const slides = carousel.querySelectorAll('.carousel__slide');
    const prevBtn = carousel.querySelector('.carousel__btn--prev');
    const nextBtn = carousel.querySelector('.carousel__btn--next');
    const dotsContainer = carousel.querySelector('.carousel__dots');
    let currentIndex = 0;
    let autoplayTimer;

    const getSlidesPerView = () => {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    };

    const getMaxIndex = () => Math.max(0, slides.length - getSlidesPerView());

    const buildDots = () => {
      dotsContainer.innerHTML = '';
      const total = getMaxIndex() + 1;
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel__dot' + (i === currentIndex ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    };

    const updateCarousel = () => {
      const slideWidth = 100 / getSlidesPerView();
      track.style.transform = 'translateX(-' + (currentIndex * slideWidth) + '%)';
      dotsContainer.querySelectorAll('.carousel__dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    };

    const goTo = (index) => {
      currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
      updateCarousel();
      resetAutoplay();
    };

    const resetAutoplay = () => {
      clearInterval(autoplayTimer);
      autoplayTimer = setInterval(() => {
        currentIndex = currentIndex >= getMaxIndex() ? 0 : currentIndex + 1;
        updateCarousel();
      }, 5000);
    };

    prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
    nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

    window.addEventListener('resize', () => {
      if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
      buildDots();
      updateCarousel();
    });

    buildDots();
    updateCarousel();
    resetAutoplay();
  });

});

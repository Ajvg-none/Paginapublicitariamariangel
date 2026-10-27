/* ════════════════════════════════════════════════════════════
   EDICIONES BY MARIANGEL
   script.js — Interacciones, animaciones y rendimiento

   Módulos (IIFEs independientes):
   1. Inicialización global (JS flag, smooth scroll, utilidades)
   2. Navbar (progreso, sección activa, show/hide)
   3. Hero (partículas, parallax de iconos, timecode)
   4. About (revelado escalonado, parallax de foto)
   5. Process (revelado de pasos y encabezado)
   ════════════════════════════════════════════════════════════ */
'use strict';

/* ─────────────────────────────────────────────
   1. INICIALIZACIÓN GLOBAL
   ───────────────────────────────────────────── */

/* Marca JS activo → habilita estados ocultos para reveal.
   Sin JS, todo el contenido permanece visible (accesibilidad). */
document.documentElement.classList.add('js');

/* Detección de preferencia de movimiento reducido.
   Se consulta una sola vez y se comparte entre módulos. */
const prefiereSinMovimiento =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Utilidad: debounce para evitar ejecuciones excesivas */
function debounce(fn, ms) {
  let id;
  return function (...args) {
    clearTimeout(id);
    id = setTimeout(() => fn.apply(this, args), ms);
  };
}

/* ── Smooth scroll para TODOS los enlaces internos (#) ──
   Respeta prefers-reduced-motion.
   Previene el default solo si el target existe → links
   a secciones futuras (#contacto, #portafolio) no rompen nada. */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefiereSinMovimiento ? 'auto' : 'smooth'
      });
      /* Actualizar hash en URL sin salto (para historial) */
      history.pushState(null, '', href);
    }
    /* Si el target no existe (ej: #contacto), no hace nada */
  });
});

/* ─────────────────────────────────────────────
   2. NAVBAR · progreso, sección activa, show/hide
   ───────────────────────────────────────────── */
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const progressBar = nav.querySelector('.nav__progress');
  const navLinks = nav.querySelectorAll('.nav__link');
  const sections = document.querySelectorAll('section[id]');

  let lastScrollY = 0;
  let ticking = false;

  function updateNav() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    /* ── Barra de progreso: ancho proporcional al scroll ── */
    if (progressBar && docHeight > 0) {
      const pct = Math.min((scrollY / docHeight) * 100, 100);
      progressBar.style.width = pct + '%';
    }

    /* ── Show/hide según dirección de scroll ──
       Solo aplica tras pasar ~100px (dentro del hero, siempre visible) */
    if (scrollY > 100) {
      nav.classList.add('is-scrolled');
      /* Umbral de 5px para evitar flickering */
      if (scrollY > lastScrollY + 5) {
        nav.classList.add('is-hidden');      /* scroll ↓ → ocultar */
      } else if (scrollY < lastScrollY - 5) {
        nav.classList.remove('is-hidden');   /* scroll ↑ → mostrar */
      }
    } else {
      nav.classList.remove('is-scrolled', 'is-hidden');
    }

    /* ── Sección activa: actualizar indicador del link ── */
    let currentSectionId = '';
    for (const section of sections) {
      /* offsetTop - 120px para activar un poco antes de llegar */
      if (scrollY >= section.offsetTop - 120) {
        currentSectionId = section.id;
      }
    }
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + currentSectionId;
      link.classList.toggle('is-active', isActive);
    });

    lastScrollY = scrollY;
    ticking = false;
  }

  /* Listener de scroll con passive:true y rAF throttle */
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  /* Estado inicial */
  updateNav();
})();


/* ─────────────────────────────────────────────
   3. HERO · partículas, parallax, timecode
   ───────────────────────────────────────────── */
(() => {
  const hero = document.getElementById('hero');
  if (!hero) return;

  /* ── 3.1 PARTÍCULAS · "destellos de edición" ──
     Puntos, cruces y destellos que suben con balanceo y parpadeo.
     Cap de partículas adaptativo según viewport. */
  const canvas = hero.querySelector('.hero__particles');
  const ctx = canvas.getContext('2d');

  /* Colores de partícula (prefijo rgba, el alfa se concatena) */
  const COLORES = [
    'rgba(167, 139, 250,',  // violeta suave
    'rgba(244, 114, 182,',  // rosa
    'rgba(255, 255, 255,',  // blanco
    'rgba(139, 92, 246,',   // violeta vivo
  ];
  const DORADO = 'rgba(217, 180, 91,';

  let particulas = [];
  let ancho = 0, alto = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function crearParticula(altoCanvas) {
    const esDorada = Math.random() < 0.12;
    const tipo = Math.random();
    return {
      x: Math.random() * ancho,
      y: altoCanvas !== undefined ? altoCanvas : Math.random() * alto,
      tam: 1 + Math.random() * 2.2,
      vy: 0.15 + Math.random() * 0.4,
      amp: 8 + Math.random() * 22,
      fase: Math.random() * Math.PI * 2,
      frec: 0.0004 + Math.random() * 0.0008,
      alfaBase: 0.25 + Math.random() * 0.5,
      parpadeo: 0.001 + Math.random() * 0.002,
      color: esDorada ? DORADO : COLORES[(Math.random() * COLORES.length) | 0],
      tipo: tipo < 0.55 ? 0 : tipo < 0.8 ? 1 : 2,
    };
  }

  function dimensionarCanvas() {
    const rect = hero.getBoundingClientRect();
    ancho = rect.width;
    alto = rect.height;
    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Densidad adaptativa: menos partículas en móvil */
    const cantidad = Math.max(22, Math.min(80, Math.floor((ancho * alto) / 16000)));
    particulas = Array.from({ length: cantidad }, () => crearParticula());
  }

  function dibujarParticula(p, alfa) {
    ctx.strokeStyle = p.color + alfa + ')';
    ctx.fillStyle = p.color + alfa + ')';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    if (p.tipo === 0) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const s = p.tam * 2.4;
      ctx.beginPath();
      if (p.tipo === 1) {
        ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
        ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
      } else {
        const d = s * 0.72;
        ctx.moveTo(p.x - d, p.y - d); ctx.lineTo(p.x + d, p.y + d);
        ctx.moveTo(p.x + d, p.y - d); ctx.lineTo(p.x - d, p.y + d);
      }
      ctx.stroke();
    }
  }

  function actualizarYDibujarParticulas(t, dt) {
    ctx.clearRect(0, 0, ancho, alto);
    for (const p of particulas) {
      p.y -= p.vy * dt * 0.06;
      if (p.y < -14) {
        p.y = alto + 14;
        p.x = Math.random() * ancho;
      }
      const x = p.x + Math.sin(t * p.frec + p.fase) * p.amp * 0.35;
      const alfa = p.alfaBase * (0.45 + 0.55 * Math.sin(t * p.parpadeo + p.fase));
      const respaldoX = p.x; p.x = x;
      dibujarParticula(p, Math.max(alfa, 0.05).toFixed(3));
      p.x = respaldoX;
    }
  }

  /* ── 3.2 PARALLAX SUAVE DE LOS ICONOS ──
     Solo en dispositivos con puntero fino. */
  const capasParallax = Array.from(hero.querySelectorAll('[data-depth]'));
  const punteroFino = window.matchMedia('(pointer: fine)').matches;

  let objetivoX = 0, objetivoY = 0;
  let actualX = 0, actualY = 0;

  if (punteroFino && !prefiereSinMovimiento) {
    /* PERF: passive:true en pointermove */
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      objetivoX = (e.clientX - r.left) / r.width - 0.5;
      objetivoY = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { objetivoX = 0; objetivoY = 0; });
  }

  function aplicarParallax() {
    if (!punteroFino || prefiereSinMovimiento) return;
    actualX += (objetivoX - actualX) * 0.06;
    actualY += (objetivoY - actualY) * 0.06;
    for (const capa of capasParallax) {
      const prof = Number(capa.dataset.depth) || 10;
      capa.style.transform =
        `translate3d(${(actualX * prof).toFixed(2)}px, ${(actualY * prof).toFixed(2)}px, 0)`;
    }
  }

  /* ── 3.3 BUCLE PRINCIPAL (rAF) ──
     Se pausa si la pestaña está oculta o el hero
     sale de pantalla → ahorro de recursos. */
  let idRaf = null;
  let ultimaMarca = 0;
  let visibleEnPantalla = true;

  function bucle(t) {
    const dt = Math.min(t - ultimaMarca, 50);
    ultimaMarca = t;
    actualizarYDibujarParticulas(t, dt);
    aplicarParallax();
    idRaf = requestAnimationFrame(bucle);
  }

  function iniciar() {
    if (idRaf !== null) return;
    ultimaMarca = performance.now();
    idRaf = requestAnimationFrame(bucle);
  }
  function detener() {
    if (idRaf === null) return;
    cancelAnimationFrame(idRaf);
    idRaf = null;
  }

  /* ── 3.4 TIMECODE de la barra de estado ──
     PERF: se pausa cuando el hero no está visible
     para evitar wakeups innecesarios cada segundo. */
  const timecode = document.getElementById('timecode');
  let timecodeInterval = null;
  let segundos = 0;
  const dosDigitos = (n) => String(n).padStart(2, '0');

  function iniciarTimecode() {
    if (timecodeInterval || !timecode) return;
    timecodeInterval = setInterval(() => {
      segundos += 1;
      const h = Math.floor(segundos / 3600);
      const m = Math.floor((segundos % 3600) / 60);
      const s = segundos % 60;
      timecode.textContent = `${dosDigitos(h)}:${dosDigitos(m)}:${dosDigitos(s)}`;
    }, 1000);
  }

  function detenerTimecode() {
    if (timecodeInterval) {
      clearInterval(timecodeInterval);
      timecodeInterval = null;
    }
  }

  /* ── 3.5 ARRANQUE Y EVENTOS ── */
  if (prefiereSinMovimiento) {
    canvas.classList.add('hero__particles--estatico');
  } else {
    dimensionarCanvas();
    iniciar();
    iniciarTimecode();

    /* Redimensionado con debounce (150ms) */
    window.addEventListener('resize', debounce(() => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      dimensionarCanvas();
    }, 150));

    /* Pausar cuando la pestaña está oculta */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !visibleEnPantalla) {
        detener();
        detenerTimecode();
      } else {
        iniciar();
        iniciarTimecode();
      }
    });

    /* Pausar cuando el hero sale de pantalla
       PERF: pausa partículas Y timecode al salir del viewport */
    new IntersectionObserver(([entrada]) => {
      visibleEnPantalla = entrada.isIntersecting;
      if (visibleEnPantalla && !document.hidden) {
        iniciar();
        iniciarTimecode();
      } else {
        detener();
        detenerTimecode();
      }
    }, { threshold: 0 }).observe(hero);
  }
})();


/* ─────────────────────────────────────────────
   4. ABOUT · revelado escalonado + parallax de foto
   ───────────────────────────────────────────── */
(() => {
  const about = document.querySelector('.about');
  if (!about) return;

  /* ── 4.1 REVELADO ESCALONADO (IntersectionObserver) ──
     Cada .reveal usa --i para su delay (×150ms).
     Se anima una sola vez y se deja de observar.
     PERF: tras la transición, se limpia will-change. */
  const revelables = about.querySelectorAll('.reveal');

  if (prefiereSinMovimiento || !('IntersectionObserver' in window)) {
    revelables.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          observador.unobserve(entrada.target);

          /* PERF: limpiar will-change tras completar la transición
             Espera lo suficiente para que la animación termine
             (delay máximo: --i:6 × 150ms = 900ms + 900ms transición) */
          const delay = parseInt(getComputedStyle(entrada.target).getPropertyValue('--i') || 0);
          const timeout = (delay * 150) + 1000;
          setTimeout(() => {
            entrada.target.classList.add('reveal--done');
          }, timeout);
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    });
    revelables.forEach((el) => observador.observe(el));
  }

  /* ── 4.2 PARALLAX DE LA FOTO (solo scroll) ──
     Transform en .about__parallax, capa aislada.
     Limitado a ±16px. */
  const capaParallax = about.querySelector('.about__parallax');

  if (capaParallax && !prefiereSinMovimiento) {
    let framePendiente = false;

    const actualizarParallax = () => {
      const rect = capaParallax.getBoundingClientRect();
      const centro = rect.top + rect.height / 2;
      const desfase = (centro - window.innerHeight / 2) * -0.045;
      const limitado = Math.max(-16, Math.min(16, desfase));
      capaParallax.style.transform = `translate3d(0, ${limitado.toFixed(2)}px, 0)`;
      framePendiente = false;
    };

    /* PERF: passive:true en scroll (ya existía, mantenido) */
    window.addEventListener('scroll', () => {
      if (!framePendiente) {
        framePendiente = true;
        requestAnimationFrame(actualizarParallax);
      }
    }, { passive: true });

    actualizarParallax();
  }
})();


/* ─────────────────────────────────────────────
   5. PROCESS · revelado de pasos y encabezado
   ───────────────────────────────────────────── */
(() => {
  const services = document.querySelector('.services');
  if (!services) return;

  /* Elementos que se revelan */
  const objetivos = services.querySelectorAll([
    '.process__header',
    '.process__timeline',
    '.process-step',
    '.process__cta',
  ].join(','));

  /* Sin animación: todo visible de inmediato */
  if (prefiereSinMovimiento || !('IntersectionObserver' in window)) {
    objetivos.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        observador.unobserve(entrada.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -6% 0px',
  });

  objetivos.forEach((el) => observador.observe(el));
})();


/* ─────────────────────────────────────────────
   6. EXPLORAR · reveal inicial + toggle del panel
   ───────────────────────────────────────────── */
(() => {
  const explore = document.querySelector('.explore');
  if (!explore) return;

  /* ── 6.1 Reveal inicial (título → subtítulo → botón) ── */
  const revelables = explore.querySelectorAll('.reveal');

  if (prefiereSinMovimiento || !('IntersectionObserver' in window)) {
    revelables.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          observador.unobserve(entrada.target);

          /* PERF: limpiar will-change al terminar la transición */
          const delay = parseInt(getComputedStyle(entrada.target).getPropertyValue('--i') || 0);
          setTimeout(() => {
            entrada.target.classList.add('reveal--done');
          }, (delay * 150) + 1000);
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    });
    revelables.forEach((el) => observador.observe(el));
  }

  /* ── 6.2 Toggle del panel desplegable ── */
  const trigger = explore.querySelector('.explore__trigger');
  const panel = explore.querySelector('.explore__panel');
  if (trigger && panel) {
    trigger.addEventListener('click', () => {
      const abierto = panel.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
  }

  /* ── 6.3 Reproductor de Videos Verticales ──
     Carga diferida: el primer video se pide solo cuando la sección
     entra en pantalla. Se pausa al salir. */
  const VIDEOS = [
    { src: 'videos/reel-01.mp4', poster: 'videos/reel-01.jpg' },
    { src: 'videos/reel-02.mp4', poster: 'videos/reel-02.jpg' },
    { src: 'videos/reel-03.mp4', poster: 'videos/reel-03.jpg' },
    { src: 'videos/reel-04.mp4', poster: 'videos/reel-04.jpg' }
  ];

  const phoneVideo = document.getElementById('phone-video-elem');
  const placeholder = document.getElementById('phone-placeholder');
  const playBtn = document.getElementById('placeholder-play-btn');
  const soundToggle = document.getElementById('phone-sound-toggle');
  const soundIcon = document.getElementById('phone-sound-icon');
  const progressBar = document.getElementById('phone-progress-bar');
  const videoCounter = document.getElementById('phone-video-counter');
  const trackerDots = document.querySelectorAll('.phone-tracker');

  let currentVideoIndex = 0;
  let autoTimer = null;
  let simulatedProgress = 0;
  let isVideoPlayingReal = false;
  let iniciado = false;
  let seccionVisible = false;

  function ocultarPlaceholder() {
    if (!placeholder) return;
    placeholder.hidden = true;
    placeholder.inert = true;
  }

  function mostrarPlaceholder() {
    if (!placeholder) return;
    placeholder.hidden = false;
    placeholder.inert = false;
  }

  function updateVideoUI(index) {
    if (videoCounter) videoCounter.textContent = `${index + 1} / ${VIDEOS.length}`;
    trackerDots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });
    if (progressBar) progressBar.style.width = '0%';
  }

  function loadVideo(index) {
    if (!phoneVideo) return;
    const info = VIDEOS[index];
    if (!info) return;

    iniciado = true;
    currentVideoIndex = index;
    isVideoPlayingReal = false;
    updateVideoUI(index);

    phoneVideo.pause();
    phoneVideo.src = info.src;
    phoneVideo.poster = info.poster;
    phoneVideo.load();

    const playPromise = phoneVideo.play();
    if (playPromise === undefined) return;

    playPromise.then(() => {
      isVideoPlayingReal = true;
      ocultarPlaceholder();
      clearInterval(autoTimer);
    }).catch(() => {
      /* Si el navegador bloquea el audio, reintentar en silencio */
      if (!phoneVideo.muted) {
        phoneVideo.muted = true;
        if (soundIcon) soundIcon.textContent = '🔇';
        phoneVideo.play().then(() => {
          isVideoPlayingReal = true;
          ocultarPlaceholder();
          clearInterval(autoTimer);
        }).catch(() => {
          isVideoPlayingReal = false;
          mostrarPlaceholder();
          startAutoCycle();
        });
      } else {
        isVideoPlayingReal = false;
        mostrarPlaceholder();
        startAutoCycle();
      }
    });
  }

  /* Rotación de respaldo si ningún video puede reproducirse */
  function startAutoCycle() {
    clearInterval(autoTimer);
    simulatedProgress = 0;
    autoTimer = setInterval(() => {
      simulatedProgress += 2;
      if (progressBar) progressBar.style.width = `${simulatedProgress}%`;
      if (simulatedProgress >= 100) {
        loadVideo((currentVideoIndex + 1) % VIDEOS.length);
      }
    }, 110);
  }

  if (phoneVideo) {
    phoneVideo.addEventListener('ended', () => {
      loadVideo((currentVideoIndex + 1) % VIDEOS.length);
    });

    phoneVideo.addEventListener('timeupdate', () => {
      if (isVideoPlayingReal && phoneVideo.duration) {
        const pct = (phoneVideo.currentTime / phoneVideo.duration) * 100;
        if (progressBar) progressBar.style.width = `${pct}%`;
      }
    });

    phoneVideo.addEventListener('playing', () => {
      isVideoPlayingReal = true;
      ocultarPlaceholder();
      clearInterval(autoTimer);
    });

    phoneVideo.addEventListener('error', () => {
      if (!iniciado) return;
      isVideoPlayingReal = false;
      mostrarPlaceholder();
      startAutoCycle();
    });
  }

  trackerDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.video || '0', 10);
      loadVideo(idx);
    });
  });

  if (soundToggle && phoneVideo) {
    soundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      phoneVideo.muted = !phoneVideo.muted;
      if (soundIcon) soundIcon.textContent = phoneVideo.muted ? '🔇' : '🔊';
    });
  }

  if (playBtn && phoneVideo) {
    playBtn.addEventListener('click', () => {
      phoneVideo.play().then(() => {
        ocultarPlaceholder();
      }).catch(() => {
        iniciado = true;
        startAutoCycle();
      });
    });
  }

  /* Arranque diferido: solo cuando el teléfono entra en pantalla */
  if (phoneVideo) {
    if ('IntersectionObserver' in window) {
      const observadorVideo = new IntersectionObserver(([entrada]) => {
        seccionVisible = entrada.isIntersecting;

        if (seccionVisible) {
          if (!iniciado) {
            loadVideo(0);
          } else if (isVideoPlayingReal) {
            phoneVideo.play().catch(() => {});
          } else {
            startAutoCycle();
          }
        } else {
          phoneVideo.pause();
          clearInterval(autoTimer);
        }
      }, { threshold: 0.25 });

      observadorVideo.observe(explore.querySelector('.phone-device') || explore);
    } else {
      loadVideo(0);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        phoneVideo.pause();
        clearInterval(autoTimer);
      } else if (seccionVisible && iniciado) {
        if (isVideoPlayingReal) {
          phoneVideo.play().catch(() => {});
        } else {
          startAutoCycle();
        }
      }
    });
  }
})();


/* ─────────────────────────────────────────────
   7. SECCIONES DE SERVICIOS · reveal on-scroll
   Paquetes · Qué incluye · Adicionales · Condiciones · Contacto
   ───────────────────────────────────────────── */
(() => {
  const secciones = document.querySelectorAll('.pricing, .includes, .extras, .conditions, .contact');
  if (!secciones.length) return;

  /* Objetivos: bloques con la utilidad .reveal + tarjetas con reveal propio */
  const objetivos = [];
  secciones.forEach((sec) => {
    sec.querySelectorAll('.reveal, .price-card, .extra-card').forEach((el) => objetivos.push(el));
  });

  if (prefiereSinMovimiento || !('IntersectionObserver' in window)) {
    objetivos.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        observador.unobserve(entrada.target);

        /* PERF: limpiar will-change en los .reveal al terminar */
        if (entrada.target.classList.contains('reveal')) {
          const delay = parseInt(getComputedStyle(entrada.target).getPropertyValue('--i') || 0);
          setTimeout(() => {
            entrada.target.classList.add('reveal--done');
          }, (delay * 150) + 1000);
        }
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -6% 0px',
  });

  objetivos.forEach((el) => observador.observe(el));
})();
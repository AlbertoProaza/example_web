(function () {
  "use strict";

  /* ── Helpers ─────────────────────────────────────── */
  var $ = function (sel, s) { return (s || document).querySelector(sel); };
  var $$ = function (sel, s) { return Array.from((s || document).querySelectorAll(sel)); };
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ── Custom cursor ────────────────────────────────── */
  function initCursor() {
    if (!fineHover) return;
    var cursor = $(".cursor");
    if (!cursor) return;
    var dot  = $(".cursor-dot");
    var ring = $(".cursor-ring");
    var rx = 0, ry = 0, dx = 0, dy = 0;
    var firstMove = false;

    window.addEventListener("mousemove", function (e) {
      dx = e.clientX; dy = e.clientY;
      if (!firstMove) {
        firstMove = true;
        rx = dx; ry = dy;
        ring.style.transform = "translate3d(" + (rx - 16) + "px," + (ry - 16) + "px,0)";
        cursor.classList.add("is-ready");
      }
      dot.style.transform = "translate3d(" + (dx - 3.5) + "px," + (dy - 3.5) + "px,0)";
    });

    (function loop() {
      rx += (dx - rx) * 0.1;
      ry += (dy - ry) * 0.1;
      ring.style.transform = "translate3d(" + (rx - 16) + "px," + (ry - 16) + "px,0)";
      requestAnimationFrame(loop);
    })();

    var hoverSel = "a, button, .product-card, .feature-card, .gallery-item, .testimonial-card, .product-cta, .btn";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hoverSel)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hoverSel)) cursor.classList.remove("is-hover");
    });
  }

  /* ── Navbar ───────────────────────────────────────── */
  function initNav() {
    var nav = $("#nav");
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 32);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = $(".nav-toggle");
    var mobile = $(".nav-mobile");
    if (toggle && mobile) {
      toggle.addEventListener("click", function () {
        var open = mobile.classList.toggle("is-open");
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
      });
      $$("a", mobile).forEach(function (a) {
        a.addEventListener("click", function () {
          mobile.classList.remove("is-open");
          toggle.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    });
  }

  /* ── Hero word-split entrance ─────────────────────── */
  function initHeroEntrance() {
    var lines = $$(".hero-line");
    var kicker = $(".hero-kicker");
    var sub = $(".hero-sub");
    var actions = $(".hero-actions");

    /* Split each line into word spans */
    lines.forEach(function (line) {
      var text = line.innerHTML;
      /* Wrap words but preserve <em> tags */
      var wrapped = text.replace(/(<em>[^<]*<\/em>|[^\s<]+)/g, function (match) {
        return '<span class="word-wrap"><span class="word-inner">' + match + '</span></span>';
      });
      line.innerHTML = wrapped;
      line.style.opacity = "1";
      line.style.transform = "none";
    });

    if (!window.gsap) return;

    var tl = gsap.timeline({ delay: 0.2 });

    if (kicker) {
      kicker.style.opacity = "0";
      kicker.style.transform = "translateY(16px)";
      tl.to(kicker, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
    }

    lines.forEach(function (line, i) {
      var words = $$(".word-inner", line);
      words.forEach(function (w) {
        w.style.display = "inline-block";
        w.style.transform = "translateY(100%) rotateX(-40deg)";
        w.style.opacity = "0";
      });
      tl.to(words, {
        y: 0, rotateX: 0, opacity: 1,
        duration: 0.75, ease: "power3.out",
        stagger: 0.07,
        transformOrigin: "50% 50%"
      }, 0.15 + i * 0.1);
    });

    if (sub) {
      sub.style.opacity = "0"; sub.style.transform = "translateY(20px)";
      tl.to(sub, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.55);
    }
    if (actions) {
      actions.style.opacity = "0"; actions.style.transform = "translateY(20px)";
      tl.to(actions, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.7);
    }
  }

  /* ── Hero title morph on hover ───────────────────── */
  function initTitleMorph() {
    var title = $(".hero-title");
    if (!title) return;

    var phrases = [
      ["El espacio que", "<em>mereces</em> vivir."],
      ["Tu hogar,", "<em>rediseñado.</em>"],
      ["Madera que", "<em>dura siglos.</em>"],
      ["Diseño que", "<em>te define.</em>"]
    ];
    var current = 0;
    var animating = false;
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    function scrambleTo(lines, onDone) {
      var lineEls = $$(".hero-line", title);
      var total = lines.length;
      var done = 0;

      lineEls.forEach(function (el, i) {
        var target = lines[i] || "";
        /* Strip tags to get plain target */
        var plain = target.replace(/<[^>]+>/g, "");
        var orig = el.textContent;
        var maxLen = Math.max(orig.length, plain.length);
        var frame = 0;
        var FRAMES = 14;

        var raf = setInterval(function () {
          frame++;
          var progress = frame / FRAMES;
          var result = "";
          for (var c = 0; c < maxLen; c++) {
            if (c < plain.length * progress) {
              result += plain[c];
            } else {
              result += CHARS[Math.floor(Math.random() * CHARS.length)];
            }
          }
          el.textContent = result;
          if (frame >= FRAMES) {
            clearInterval(raf);
            el.innerHTML = target; /* restore with tags */
            done++;
            if (done === total && onDone) onDone();
          }
        }, 30);
      });
    }

    title.addEventListener("mouseenter", function () {
      if (!fineHover || animating) return;
      animating = true;
      current = (current + 1) % phrases.length;
      scrambleTo(phrases[current], function () { animating = false; });
    });
  }

  /* ── Hero parallax ────────────────────────────────── */
  function initHeroParallax() {
    var heroImg = $(".hero-img");
    var heroContent = $(".hero-content");
    if (!heroImg) return;

    window.addEventListener("scroll", function () {
      var sy = window.scrollY;
      if (sy > window.innerHeight * 1.2) return;
      heroImg.style.transform     = "translate3d(0," + (sy * 0.38) + "px,0)";
      if (heroContent) heroContent.style.transform = "translate3d(0," + (sy * 0.12) + "px,0)";
    }, { passive: true });
  }

  /* ── Scroll reveals with 3D perspective ──────────── */
  function initReveals3D() {
    var targets = $$(".reveal-fade, .reveal-up, .reveal-line");
    if (!targets.length) return;

    /* Add perspective to parent sections */
    $$("section, .stats, .footer").forEach(function (s) {
      s.style.perspective = "1200px";
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -2% 0px" });

    targets.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
    }, 6000);
  }

  /* ── GSAP scroll-driven 3D section reveals ────────── */
  function initScrollTrigger3D() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    /* Section headers fly in with slight rotateX */
    $$(".section-header, .about-text, .contact-info").forEach(function (el) {
      gsap.fromTo(el,
        { y: 60, rotateX: 12, opacity: 0, transformOrigin: "50% 0%" },
        {
          y: 0, rotateX: 0, opacity: 1, duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true }
        }
      );
    });

    /* Gallery items cascade in with 3D rotation */
    $$(".gallery-item").forEach(function (el, i) {
      gsap.fromTo(el,
        { y: 80, rotateY: i % 2 === 0 ? -8 : 8, opacity: 0, scale: 0.92 },
        {
          y: 0, rotateY: 0, opacity: 1, scale: 1,
          duration: 0.9, ease: "power3.out",
          delay: (i % 3) * 0.1,
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        }
      );
    });

    /* Testimonial cards flip in */
    $$(".testimonial-card").forEach(function (el, i) {
      gsap.fromTo(el,
        { y: 50, rotateX: -10, opacity: 0, transformOrigin: "50% 100%" },
        {
          y: 0, rotateX: 0, opacity: 1, duration: 0.85, ease: "power3.out",
          delay: i * 0.12,
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        }
      );
    });

    /* Feature cards slide in from sides alternating */
    $$(".feature-card").forEach(function (el, i) {
      var dir = i % 2 === 0 ? -40 : 40;
      gsap.fromTo(el,
        { x: dir, rotateY: i % 2 === 0 ? -6 : 6, opacity: 0 },
        {
          x: 0, rotateY: 0, opacity: 1, duration: 0.85, ease: "power3.out",
          delay: i * 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        }
      );
    });

    /* Product cards stagger in with scale + rotate */
    $$(".product-card").forEach(function (el, i) {
      gsap.fromTo(el,
        { y: 60, scale: 0.88, rotateX: 6, opacity: 0, transformOrigin: "50% 100%" },
        {
          y: 0, scale: 1, rotateX: 0, opacity: 1,
          duration: 0.9, ease: "back.out(1.4)",
          delay: (i % 3) * 0.1,
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        }
      );
    });

    /* About image dramatic entrance */
    var aboutMedia = $(".about-media");
    if (aboutMedia) {
      gsap.fromTo(aboutMedia,
        { x: 80, rotateY: -12, opacity: 0, transformOrigin: "0% 50%" },
        {
          x: 0, rotateY: 0, opacity: 1, duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: aboutMedia, start: "top 80%", once: true }
        }
      );
    }

    /* Stats counter-up with scale pop */
    $$(".stat-item").forEach(function (el, i) {
      gsap.fromTo(el,
        { y: 40, scale: 0.7, opacity: 0 },
        {
          y: 0, scale: 1, opacity: 1, duration: 0.7,
          ease: "back.out(2)",
          delay: i * 0.1,
          scrollTrigger: { trigger: el, start: "top 85%", once: true }
        }
      );
    });
  }

  /* ── 3D tilt on cards ─────────────────────────────── */
  function initTilt3D() {
    if (!fineHover) return;
    var cards = $$(".product-card, .feature-card, .testimonial-card");

    cards.forEach(function (card) {
      var MAX = 10;
      var rect;

      card.style.transformStyle = "preserve-3d";
      card.style.transition = "transform 0.1s ease, box-shadow 0.3s ease";

      card.addEventListener("mouseover", function () {
        rect = card.getBoundingClientRect();
      });

      card.addEventListener("mousemove", function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width / 2);
        var dy = (e.clientY - cy) / (rect.height / 2);
        var rx = -dy * MAX;
        var ry = dx * MAX;
        card.style.transform = "perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateZ(10px) scale(1.02)";
        card.style.boxShadow = "0 24px 60px rgba(139,94,60," + (0.1 + Math.abs(dx) * 0.08) + ")," +
          (ry * -1.5) + "px " + (rx * 1.5) + "px 30px rgba(139,94,60,0.08)";
      });

      card.addEventListener("mouseleave", function () {
        card.style.transition = "transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease";
        card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)";
        card.style.boxShadow = "";
        rect = null;
      });
    });
  }

  /* ── Magnetic buttons ─────────────────────────────── */
  function initMagneticBtns() {
    if (!fineHover) return;
    var btns = $$(".btn-primary, .btn-nav, .btn-outline");

    btns.forEach(function (btn) {
      var rect;
      var STRENGTH = 0.3;

      btn.addEventListener("mouseover", function () {
        rect = btn.getBoundingClientRect();
        btn.style.transition = "transform 0.1s ease, box-shadow 0.3s ease";
      });

      btn.addEventListener("mousemove", function (e) {
        if (!rect) rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) * STRENGTH;
        var dy = (e.clientY - cy) * STRENGTH;
        btn.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.04)";
      });

      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, background 0.25s, color 0.25s";
        btn.style.transform = "";
        rect = null;
      });
    });
  }

  /* ── Parallax on section images ─────────────────── */
  function initImgParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;

    $$(".about-img-wrap img, .gallery-item img").forEach(function (img) {
      gsap.fromTo(img,
        { y: -30 },
        {
          y: 30,
          ease: "none",
          scrollTrigger: {
            trigger: img,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2
          }
        }
      );
    });
  }

  /* ── Count-up ─────────────────────────────────────── */
  function initCounters() {
    var items = $$("[data-count]");
    if (!items.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var start = performance.now();
        var DURATION = 1600;

        (function step(now) {
          var p = Math.min((now - start) / DURATION, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.05 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ── Contact form ────────────────────────────────── */
  function initContactForm() {
    var form = $("#contact-form");
    if (!form) return;
    var btn = form.querySelector(".btn-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      btn.classList.add("is-sending"); btn.disabled = true;
      setTimeout(function () {
        btn.classList.remove("is-sending"); btn.classList.add("is-sent");
        setTimeout(function () { btn.classList.remove("is-sent"); btn.disabled = false; form.reset(); }, 4000);
      }, 1800);
    });
  }

  /* ── Scroll-driven number in hero (bonus) ─────────── */
  function initHeroScrollIndicator() {
    var line = $(".hero-scroll-line");
    if (!line) return;
    window.addEventListener("scroll", function () {
      var progress = Math.min(window.scrollY / (window.innerHeight * 0.5), 1);
      line.style.opacity = String(0.6 - progress * 0.6);
    }, { passive: true });
  }

  /* ── CSS: word-wrap overflow hidden ─────────────── */
  function injectWordWrapStyle() {
    var st = document.createElement("style");
    st.textContent = [
      ".word-wrap{display:inline-block;overflow:hidden;vertical-align:bottom;line-height:1.1;}",
      ".word-wrap + .word-wrap{margin-left:0.22em;}",
      ".word-inner{display:inline-block;will-change:transform,opacity;perspective:600px;}"
    ].join("");
    document.head.appendChild(st);
  }

  /* ── Boot ─────────────────────────────────────────── */
  function boot() {
    safe(injectWordWrapStyle,     "injectWordWrapStyle");
    safe(initCursor,              "initCursor");
    safe(initNav,                 "initNav");
    safe(initHeroEntrance,        "initHeroEntrance");
    safe(initTitleMorph,          "initTitleMorph");
    safe(initHeroParallax,        "initHeroParallax");
    safe(initHeroScrollIndicator, "initHeroScrollIndicator");
    safe(initReveals3D,           "initReveals3D");
    safe(initCounters,            "initCounters");
    safe(initTilt3D,              "initTilt3D");
    safe(initMagneticBtns,        "initMagneticBtns");
    safe(initContactForm,         "initContactForm");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initScrollTrigger3D, "initScrollTrigger3D");
      safe(initImgParallax,     "initImgParallax");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();

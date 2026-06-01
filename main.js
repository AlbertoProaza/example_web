(function () {
  "use strict";

  /* ── Helpers ─────────────────────────────────────── */
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.from((scope || document).querySelectorAll(sel)); };
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
    var rafId;

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

    function lerp(a, b, t) { return a + (b - a) * t; }

    function updateRing() {
      rx = lerp(rx, dx, 0.12);
      ry = lerp(ry, dy, 0.12);
      ring.style.transform = "translate3d(" + (rx - 16) + "px," + (ry - 16) + "px,0)";
      rafId = requestAnimationFrame(updateRing);
    }
    rafId = requestAnimationFrame(updateRing);

    var hoverTargets = "a, button, .product-card, .feature-card, .gallery-item, .testimonial-card, .product-cta, .btn";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hoverTargets)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hoverTargets) && !e.relatedTarget?.closest(hoverTargets)) {
        cursor.classList.remove("is-hover");
      }
    });
  }

  /* ── Navbar ───────────────────────────────────────── */
  function initNav() {
    var nav = $("#nav");
    if (!nav) return;

    function onScroll() {
      if (window.scrollY > 32) {
        nav.classList.add("is-scrolled");
      } else {
        nav.classList.remove("is-scrolled");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* Mobile toggle */
    var toggle = $(".nav-toggle");
    var mobile = $(".nav-mobile");
    if (toggle && mobile) {
      toggle.addEventListener("click", function () {
        var open = mobile.classList.toggle("is-open");
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
      });
      /* Close on link click */
      $$("a", mobile).forEach(function (a) {
        a.addEventListener("click", function () {
          mobile.classList.remove("is-open");
          toggle.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* Smooth anchor scroll */
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 80;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: "smooth"
      });
    });
  }

  /* ── Scroll reveals ───────────────────────────────── */
  function initReveals() {
    var targets = $$(".reveal-fade, .reveal-up, .reveal-line");
    if (!targets.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -2% 0px" });

    targets.forEach(function (el) { io.observe(el); });

    /* Safety net: 6s force-reveal anything still hidden */
    setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains("is-visible")) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ── Hero parallax ────────────────────────────────── */
  function initHeroParallax() {
    var heroImg = $(".hero-img");
    if (!heroImg) return;

    function onScroll() {
      var sy = window.scrollY;
      if (sy > window.innerHeight) return;
      heroImg.style.transform = "translate3d(0," + (sy * 0.35) + "px,0)";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── Count-up animation ───────────────────────────── */
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
        var duration = 1600;
        var start = performance.now();

        function step(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          /* Ease-out cubic */
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = Math.round(eased * target);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
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
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      btn.classList.add("is-sending");
      btn.disabled = true;
      /* Simulate send (replace with real endpoint if needed) */
      setTimeout(function () {
        btn.classList.remove("is-sending");
        btn.classList.add("is-sent");
        setTimeout(function () {
          btn.classList.remove("is-sent");
          btn.disabled = false;
          form.reset();
        }, 4000);
      }, 1800);
    });
  }

  /* ── Boot ─────────────────────────────────────────── */
  function boot() {
    safe(initCursor,       "initCursor");
    safe(initNav,          "initNav");
    safe(initReveals,      "initReveals");
    safe(initCounters,     "initCounters");
    safe(initContactForm,  "initContactForm");
    safe(initHeroParallax, "initHeroParallax");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();

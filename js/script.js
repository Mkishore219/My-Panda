(() => {
    "use strict";

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = d => (reduce ? 0 : d);
    const rand = (a, b) => a + Math.random() * (b - a);

    gsap.registerPlugin(ScrollTrigger);

    /* ---------- Smooth scroll (Lenis + ScrollTrigger) ---------- */
    let lenis = null;
    function initLenis() {
        if (reduce || typeof Lenis === "undefined") return;
        lenis = new Lenis({ duration: 1.1 });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(t => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
        lenis.stop(); // locked until the welcome screen is dismissed
    }
    function scrollToTarget(t) {
        if (lenis) return lenis.scrollTo(t, { offset: -10 });
        if (t === 0) return window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }

    /* ---------- Heart burst ---------- */
    function burst(x, y, n = 10) {
        if (reduce) return;
        for (let i = 0; i < n; i++) {
            const el = document.createElement("i");
            el.className = "ri-heart-fill burst";
            document.body.appendChild(el);
            gsap.fromTo(el,
                { x, y, scale: 0, opacity: 1, rotation: rand(-30, 30) },
                { x: x + rand(-90, 90), y: y - rand(40, 140), scale: rand(.7, 1.6), opacity: 0, duration: rand(.9, 1.5), ease: "power2.out", onComplete: () => el.remove() });
        }
    }
    const burstAt = el => { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); };

    /* ---------- Welcome screen ---------- */
    function initWelcome() {
        const w = $("#welcome"), btn = $("#enter");
        let entered = false;

        if (!reduce && window.matchMedia("(pointer:fine)").matches) {
            const items = $$(".px", w).map(el => ({
                x: gsap.quickTo(el, "x", { duration: .9, ease: "power3.out" }),
                y: gsap.quickTo(el, "y", { duration: .9, ease: "power3.out" }),
                d: +el.dataset.d || 12
            }));
            w.addEventListener("pointermove", e => {
                const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
                items.forEach(i => { i.x(nx * i.d * 2); i.y(ny * i.d * 2); });
            });
        }

        gsap.from([".w-line", ".w-title", ".w-sub", ".btn-enter"], { y: D(26), opacity: 0, duration: D(1), stagger: .18, ease: "power3.out", delay: .2 });

        btn.addEventListener("click", () => {
            if (entered) return;
            entered = true;
            btn.disabled = true;
            burstAt(btn);
   const heroLines = $$(".hero .ln");
const heroFade = $$(".hero .hero-text");
            gsap.set(heroLines, { yPercent: 110 });
            gsap.set(heroFade, { opacity: 0, y: 20 });
            gsap.timeline({ onComplete: finishEntry })
                .to(btn, { scale: .92, duration: D(.12) })
                .to(btn, { scale: 1.06, duration: D(.18) })
                .to(w, { backgroundColor: "#F8DDE5", duration: D(.5) }, "<")
                .to(".w-content", { opacity: 0, y: -24, duration: D(.5) })
                .to(w, { yPercent: -100, duration: D(.95), ease: "power3.inOut" }, "-=.1")
                .to(heroLines, { yPercent: 0, duration: D(.9), stagger: .14, ease: "power3.out" }, "-=.35")
                .to(heroFade, { opacity: 1, y: 0, duration: D(.8), stagger: .15, ease: "power2.out" }, "-=.5");
        });

        function finishEntry() {
            w.hidden = true;                      // removes the overlay from layout and pointer events
            document.body.classList.remove("locked");
            if (lenis) lenis.start();
            initScroll();
            ScrollTrigger.refresh();
        }
    }

    /* ---------- Scroll animations (created once, after entry) ---------- */
    function initScroll() {
        $$(".rv").forEach(el => {
            if (el.closest(".letter-body")) return;
            gsap.from(el, { y: D(34), opacity: 0, duration: D(.9), ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        });
        if (!reduce) {
            $$(".par").forEach(el => gsap.to(el, { yPercent: +el.dataset.s || -15, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } }));
        }
        const paras = $$(".letter-body > *");
        gsap.set(paras, { autoAlpha: 0, y: D(18) });
        ScrollTrigger.create({
            trigger: ".letter", start: "top 70%", once: true,
            onEnter: () => gsap.to(paras, { autoAlpha: 1, y: 0, duration: D(.8), stagger: D(.35), ease: "power2.out" })
        });
    }

    /* ---------- Cards: tap/keyboard support ---------- */
    function initCards() {
        $$(".tcard").forEach(card => {
            const toggle = () => { const on = card.classList.toggle("on"); card.setAttribute("aria-pressed", on); };
            card.addEventListener("click", toggle);
            card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
        });
    }

    /* ---------- Gifts ---------- */
    function initGifts() {
        $$(".gift").forEach(g => {
            const btn = $(".gift-btn", g), body = $(".gift-body", g), lid = $(".lid", g);
            const pops = $$(".pop", g), swap = g.dataset.swap, use = $(".nap use", g);
            const closed = use ? use.getAttribute("href") : null;
            let open = false, busy = false;

            btn.addEventListener("click", () => {
                if (busy) return;
                busy = true;
                open = !open;
                btn.setAttribute("aria-expanded", open);
                $(".lbl", btn).textContent = open ? "Close" : "Open me";
                const tl = gsap.timeline({ onComplete: () => { busy = false; ScrollTrigger.refresh(); } });

                if (open) {
                    burstAt(btn);
                    if (lid) tl.to(lid, g.dataset.lid === "flip" ? { rotationX: -175, duration: D(.6), ease: "power2.inOut" } : { y: -26, rotation: -9, duration: D(.5), ease: "back.out(2)" });
                    if (use && swap) tl.add(() => use.setAttribute("href", swap), 0);
                    tl.set(body, { visibility: "visible" })
                        .to(body, { height: "auto", opacity: 1, duration: D(.55), ease: "power2.out" }, lid ? "-=.2" : 0)
                        .fromTo(pops, { scale: .6, autoAlpha: 0, y: 10 }, { scale: 1, autoAlpha: 1, y: 0, duration: D(.5), stagger: .1, ease: "back.out(1.6)" }, "-=.3");
                } else {
                    tl.to(body, { height: 0, opacity: 0, duration: D(.45), ease: "power2.inOut" })
                        .set(body, { visibility: "hidden" });
                    if (lid) tl.to(lid, { rotationX: 0, y: 0, rotation: 0, duration: D(.5), ease: "power2.inOut" }, 0);
                    if (use && swap) tl.add(() => use.setAttribute("href", closed), 0.2);
                }
            });
        });
    }

    /* ---------- Scrapbook lightbox ---------- */
    function initLightbox() {
        const box = $("#lightbox"), img = $("#lb-img"), cap = $("#lb-cap"), close = $("#lb-close");
        let opener = null;
        const hide = () => {
            gsap.to(box, { opacity: 0, duration: D(.25), onComplete: () => { box.hidden = true; img.src = ""; if (lenis) lenis.start(); if (opener) opener.focus(); } });
        };
        $$(".pol-btn").forEach(b => {
            const im = $("img", b);
            im.addEventListener("error", () => { im.style.visibility = "hidden"; }); // keeps the pink frame if a photo fails
            b.addEventListener("click", () => {
                opener = b;
                img.src = im.currentSrc || im.src;
                img.alt = im.alt;
                cap.textContent = b.dataset.caption;
                box.hidden = false;
                if (lenis) lenis.stop();
                gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: D(.3) });
                close.focus();
            });
        });
        close.addEventListener("click", hide);
        box.addEventListener("click", e => { if (e.target === box) hide(); });
        document.addEventListener("keydown", e => { if (e.key === "Escape" && !box.hidden) hide(); });
    }

    /* ---------- Playlist ---------- */
    function initPlayer() {
        const player = $("#player"), audio = new Audio(), tracks = $$(".track");
        const title = $("#p-title"), artist = $("#p-artist"), status = $("#p-status");
        const play = $("#play"), seek = $("#seek");
        let cur = 0;

        const setIcon = on => {
            $("i", play).className = on ? "ri-pause-fill" : "ri-play-fill";
            play.setAttribute("aria-label", on ? "Pause" : "Play");
            player.classList.toggle("playing", on);
        };
        function select(i) {
            cur = (i + tracks.length) % tracks.length;
            const t = tracks[cur];
            tracks.forEach(x => x.classList.toggle("on", x === t));
            title.textContent = t.dataset.title;
            artist.textContent = t.dataset.artist;
            audio.pause(); setIcon(false); seek.value = 0;
            audio.src = t.dataset.src || "";
            status.textContent = t.dataset.src ? "Tap play ♡" : (t.dataset.link ? "This one lives on another app. Tap play to open it ♡" : "Add an audio file for this song in index.html ♡");
        }
        function toggle() {
            const t = tracks[cur];
            if (t.dataset.src) {
                if (audio.paused) audio.play().catch(() => { status.textContent = "Couldn't play that file. Check the path ♡"; });
                else audio.pause();
            } else if (t.dataset.link) {
                window.open(t.dataset.link, "_blank", "noopener");
            } else {
                status.textContent = "Song not added yet. Set data-src on this track in index.html ♡";
                gsap.fromTo(status, { scale: 1.08 }, { scale: 1, duration: D(.4) });
            }
        }
        audio.addEventListener("play", () => setIcon(true));
        audio.addEventListener("pause", () => setIcon(false));
        audio.addEventListener("timeupdate", () => { if (audio.duration) seek.value = (audio.currentTime / audio.duration) * 100; });
        audio.addEventListener("ended", () => { select(cur + 1); if (tracks[cur].dataset.src) audio.play(); });
        seek.addEventListener("input", () => { if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration; });
        play.addEventListener("click", toggle);
        $("#next").addEventListener("click", () => select(cur + 1));
        $("#prev").addEventListener("click", () => select(cur - 1));
        tracks.forEach((t, i) => t.addEventListener("click", () => { select(i); if (t.dataset.src) audio.play().catch(() => { }); }));
        select(0);
    }

    /* ---------- Wishlist ---------- */
    function initWishlist() {
        $$(".wish").forEach(w => w.addEventListener("click", () => {
            const on = w.getAttribute("aria-pressed") !== "true";
            w.setAttribute("aria-pressed", on);
            if (on) burstAt($(".mk", w));
        }));
    }

    /* ---------- Letter, finale, nav buttons ---------- */
    function initButtons() {
        $$("[data-goto]").forEach(b => b.addEventListener("click", () => scrollToTarget($(b.dataset.goto))));
        $$("[data-top]").forEach(b => b.addEventListener("click", () => scrollToTarget(0)));
        $("#reread").addEventListener("click", () => scrollToTarget($("#letter")));

        const last = $("#last"), msg = $("#last-msg");
        let busy = false;
        last.addEventListener("click", () => {
            if (busy || !msg.hidden) return;
            busy = true;
            const r = last.getBoundingClientRect();
            for (let i = 0; i < 4; i++) setTimeout(() => burst(r.left + r.width / 2, r.top, 8), i * 180);
            msg.hidden = false;
            last.hidden = true;
            gsap.fromTo(msg, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: D(.9), ease: "power3.out", onComplete: () => { busy = false; ScrollTrigger.refresh(); } });
        });
        $("#replay").addEventListener("click", () => {
            msg.hidden = true;
            last.hidden = false;
            scrollToTarget(0);
        });
    }

    /* ---------- Init (DOM is ready, scripts are at the end of body) ---------- */
    function init() {
        initLenis();
        initWelcome();
        initCards();
        initGifts();
        initLightbox();
        initPlayer();
        initWishlist();
        initButtons();
        window.scrollTo(0, 0);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();

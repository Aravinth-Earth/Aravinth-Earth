/**
 * Neithal / Low Tide.
 *
 * The landing is the page: a slow shore, ripples under the pointer, a tide
 * that recedes when you touch the water and comes back on its own. The shelf
 * is a native dialog behind the small button in the corner.
 *
 * No network requests, no analytics, no third-party code.
 */
(function () {
    "use strict";

    var doc = document.documentElement;
    var landing = document.querySelector(".landing");
    var langToggle = document.getElementById("lang-toggle");
    var soundToggle = document.getElementById("sound-toggle");
    var motionToggle = document.getElementById("motion-toggle");
    var langStatus = document.getElementById("lang-status");

    var shelfOpen = document.getElementById("shelf-open");
    var shelfDialog = document.getElementById("shelf-dialog");
    var shelfClose = document.getElementById("shelf-close");
    var shelfBack = document.getElementById("shelf-back");
    var shelfAbout = document.getElementById("shelf-about");
    var openAboutAfterClose = false;

    var COPY = {
        en: {
            title: "Low Tide — a quiet place for loud days",
            description:
                "A full-screen quiet place for loud days. A shelf of twelve works, Tamil and English. No accounts, no feeds, no tracking."
        },
        ta: {
            title:
                "நெய்தல் — மனம் சத்தமாக இருக்கும் நாட்களுக்கான அமைதியான இடம்",
            description:
                "மனம் சத்தமாக இருக்கும் நாட்களுக்கான முழுத்திரை அமைதியான இடம். பன்னிரண்டு இடங்களின் அலமாரி, தமிழ் மற்றும் ஆங்கிலத்தில். கணக்குகள் இல்லை, ஊட்டங்கள் இல்லை, கண்காணிப்பு இல்லை."
        }
    };

    function currentLang() {
        return doc.getAttribute("data-lang") === "ta" ? "ta" : "en";
    }

    function syncLangAria() {
        if (!langToggle) return;
        langToggle.setAttribute(
            "aria-label",
            currentLang() === "en" ? "Switch to Tamil (தமிழ்)" : "Switch to English (English)"
        );
    }

    function applyLang(lang) {
        var next = lang === "ta" ? "ta" : "en";
        doc.setAttribute("data-lang", next);
        doc.lang = next;

        document.title = COPY[next].title;
        var description = document.querySelector('meta[name="description"]');
        if (description) {
            description.setAttribute("content", COPY[next].description);
        }

        var themeGear = document.querySelector(".theme-gear");
        if (themeGear) {
            themeGear.setAttribute(
                "aria-label",
                next === "ta" ? "தோற்றத்தை மாற்று" : "Change theme"
            );
        }

        syncLangAria();
    }

    function rememberLang(lang) {
        try {
            localStorage.setItem("neithal-lang", lang);
        } catch (e) {
            /* storage unavailable -- the choice only lasts this visit. */
        }
    }

    function updateUrlLang(lang) {
        try {
            var url = new URL(window.location.href);
            url.searchParams.set("lang", lang);
            window.history.replaceState(null, "", url.toString());
        } catch (e) {
            /* file:// or an old browser -- the page still switched. */
        }
    }

    function announceLang(lang) {
        if (!langStatus) return;
        langStatus.textContent =
            lang === "ta"
                ? "மொழி தமிழுக்கு மாற்றப்பட்டது."
                : "Language changed to English.";
    }

    function chooseLang(lang) {
        applyLang(lang);
        rememberLang(lang);
        updateUrlLang(lang);
        announceLang(lang);
    }

    if (langToggle) {
        langToggle.addEventListener("click", function () {
            chooseLang(currentLang() === "en" ? "ta" : "en");
        });
    }

    applyLang(currentLang());

    /* --------------------------------------------------------------------
       Motion
       -------------------------------------------------------------------- */

    function currentMotion() {
        return motionOn() ? "on" : "off";
    }

    function motionOn() {
        var state = doc.getAttribute("data-motion");
        if (state === "off") return false;
        if (state === "on") return true;
        return !(
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        );
    }

    function normalizeMotion() {
        var state = doc.getAttribute("data-motion");
        if (state !== "on" && state !== "off") {
            doc.setAttribute("data-motion", motionOn() ? "on" : "off");
        }
    }

    function syncMotion() {
        if (!motionToggle) return;
        motionToggle.setAttribute(
            "aria-pressed",
            motionOn() ? "true" : "false"
        );
    }

    if (motionToggle) {
        motionToggle.addEventListener("click", function () {
            var next = motionOn() ? "off" : "on";
            doc.setAttribute("data-motion", next);
            try {
                localStorage.setItem("neithal-motion", next);
            } catch (e) {
                /* storage unavailable -- the choice only lasts this visit. */
            }
            if (next === "off") {
                stopRipples();
                stopAmbientRipples();
                if (tideTimer) {
                    window.clearTimeout(tideTimer);
                    tideTimer = null;
                }
                if (landing) {
                    landing.classList.remove("is-tide-out");
                    landing.style.setProperty("--px", "0px");
                    landing.style.setProperty("--py", "0px");
                }
            } else {
                startAmbientRipples();
            }
            syncMotion();
        });
    }

    syncMotion();
    normalizeMotion();
    syncMotion();

    /* --------------------------------------------------------------------
       Sound: brown noise through a slow low-pass, made in the browser.
       No audio file, no network, no licence, works offline.
       -------------------------------------------------------------------- */

    var AudioCtor = window.AudioContext || window.webkitAudioContext;
    var audio = {
        ctx: null,
        master: null,
        on: false
    };

    function makeNoiseBuffer(ctx) {
        var seconds = 4;
        var length = Math.floor(ctx.sampleRate * seconds);
        var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        var last = 0;

        for (var i = 0; i < length; i++) {
            var white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02;
            data[i] = last * 3.5;
        }

        return buffer;
    }

    function createAudio() {
        if (audio.ctx) return audio.ctx;
        if (!AudioCtor) return null;

        var ctx = new AudioCtor();
        var source = ctx.createBufferSource();
        source.buffer = makeNoiseBuffer(ctx);
        source.loop = true;

        var filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 620;
        filter.Q.value = 0.4;

        var surf = ctx.createGain();
        surf.gain.value = 0.09;

        var lfo = ctx.createOscillator();
        lfo.frequency.value = 0.065;
        var lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.02;

        var master = ctx.createGain();
        master.gain.value = 0;

        source.connect(filter);
        filter.connect(surf);
        surf.connect(master);
        master.connect(ctx.destination);

        lfo.connect(lfoGain);
        lfoGain.connect(surf.gain);

        source.start();
        lfo.start();

        audio.ctx = ctx;
        audio.master = master;
        return ctx;
    }

    function setSoundUi(on) {
        if (!soundToggle) return;
        soundToggle.setAttribute("data-sound", on ? "on" : "off");
        soundToggle.setAttribute("aria-pressed", on ? "true" : "false");
    }

    function setSound(on) {
        if (!AudioCtor) {
            if (soundToggle) soundToggle.hidden = true;
            return;
        }

        if (on) {
            var ctx = null;
            try {
                ctx = createAudio();
            } catch (e) {
                ctx = null;
            }
            if (!ctx) {
                setSoundUi(false);
                return;
            }
            audio.on = true;
            if (ctx.state === "suspended" && ctx.resume) {
                var resume = ctx.resume();
                if (resume && resume.catch) resume.catch(function () {});
            }
            var now = ctx.currentTime;
            audio.master.gain.cancelScheduledValues(now);
            audio.master.gain.setTargetAtTime(1, now, 0.9);
        } else {
            audio.on = false;
            if (audio.ctx) {
                var offAt = audio.ctx.currentTime;
                audio.master.gain.cancelScheduledValues(offAt);
                audio.master.gain.setTargetAtTime(0, offAt, 0.4);
                window.setTimeout(function () {
                    if (audio.ctx && !audio.on) {
                        audio.ctx.suspend();
                    }
                }, 1300);
            }
        }
    }

    if (soundToggle) {
        if (!AudioCtor) {
            soundToggle.hidden = true;
        } else {
            soundToggle.addEventListener("click", function () {
                var next = soundToggle.getAttribute("data-sound") !== "on";
                setSoundUi(next);
                setSound(next);
            });
        }
    }

    document.addEventListener("visibilitychange", function () {
        if (!audio.ctx) return;
        if (document.hidden) {
            audio.ctx.suspend();
        } else if (audio.on) {
            var resume = audio.ctx.resume();
            if (resume && resume.catch) resume.catch(function () {});
        }
    });

    /* --------------------------------------------------------------------
       The shelf dialog
       -------------------------------------------------------------------- */

    function finishShelfClose() {
        document.body.classList.remove("shelf-open");
        if (shelfOpen) shelfOpen.setAttribute("aria-expanded", "false");

        if (openAboutAfterClose) {
            openAboutAfterClose = false;
            if (typeof window.openAboutModal === "function") {
                window.openAboutModal(shelfOpen);
            } else if (shelfOpen) {
                shelfOpen.focus();
            }
        } else if (shelfOpen) {
            shelfOpen.focus();
        }
    }

    function openShelf() {
        if (!shelfDialog) return;
        if (typeof shelfDialog.showModal === "function") {
            if (!shelfDialog.open) shelfDialog.showModal();
        } else {
            shelfDialog.setAttribute("open", "");
        }
        document.body.classList.add("shelf-open");
        if (shelfOpen) shelfOpen.setAttribute("aria-expanded", "true");
        if (shelfClose) shelfClose.focus();
    }

    function closeShelf() {
        if (!shelfDialog) return;
        if (typeof shelfDialog.close === "function" && shelfDialog.open) {
            shelfDialog.close();
        } else {
            shelfDialog.removeAttribute("open");
            finishShelfClose();
        }
    }

    if (shelfOpen) shelfOpen.addEventListener("click", openShelf);
    if (shelfClose) shelfClose.addEventListener("click", closeShelf);
    if (shelfBack) shelfBack.addEventListener("click", closeShelf);

    if (shelfDialog) {
        shelfDialog.addEventListener("click", function (e) {
            if (e.target === shelfDialog) closeShelf();
        });
        shelfDialog.addEventListener("close", finishShelfClose);
    }

    if (shelfAbout) {
        shelfAbout.addEventListener("click", function () {
            openAboutAfterClose = true;
            closeShelf();
        });
    }

    /* --------------------------------------------------------------------
       Ripples and tide.
       The canvas is decoration; the page is complete without it.
       -------------------------------------------------------------------- */

    var canvas = document.getElementById("ripples");
    var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    var ripples = [];
    var raf = null;
    var running = false;
    var lastMove = 0;
    var tideTimer = null;
    var ambientTimer = null;
    var dpr = 1;

    function resizeCanvas() {
        if (!canvas || !ctx) return;
        var rect = landing.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ripples = [];
        ctx.clearRect(0, 0, rect.width, rect.height);
    }

    function rippleColor() {
        try {
            var value = getComputedStyle(doc)
                .getPropertyValue("--text-primary")
                .trim();
            return value || "#c9d1d9";
        } catch (e) {
            return "#c9d1d9";
        }
    }

    function spawnRipple(x, y, size) {
        if (!ctx || !motionOn()) return;
        ripples.push({
            x: x,
            y: y,
            r: 2,
            max: 70 * size + 18,
            alpha: 0.42,
            color: rippleColor()
        });
        if (!running) {
            running = true;
            raf = window.requestAnimationFrame(frame);
        }
    }

    function frame() {
        if (!ctx) {
            running = false;
            return;
        }
        var rect = landing.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.lineWidth = 1.2;

        for (var i = ripples.length - 1; i >= 0; i--) {
            var r = ripples[i];
            r.r += 1.15;
            r.alpha *= 0.986;

            if (r.alpha < 0.025 || r.r > r.max) {
                ripples.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = r.alpha;
            ctx.strokeStyle = r.color;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = r.alpha * 0.45;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.r * 0.62, r.r * 0.2, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;

        if (ripples.length) {
            raf = window.requestAnimationFrame(frame);
        } else {
            running = false;
        }
    }

    function stopRipples() {
        if (raf) {
            window.cancelAnimationFrame(raf);
            raf = null;
        }
        running = false;
        ripples = [];
        if (ctx && landing) {
            var rect = landing.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);
        }
    }

    function stopAmbientRipples() {
        if (ambientTimer) {
            window.clearTimeout(ambientTimer);
            ambientTimer = null;
        }
    }

    function startAmbientRipples() {
        if (!ctx || !landing || !motionOn()) return;
        stopAmbientRipples();

        function schedule() {
            if (!motionOn()) {
                ambientTimer = null;
                return;
            }
            if (!document.hidden) {
                var rect = landing.getBoundingClientRect();
                var x = rect.width * (0.12 + Math.random() * 0.76);
                var y = rect.height * (0.58 + Math.random() * 0.24);
                spawnRipple(x, y, 0.7);
            }
            ambientTimer = window.setTimeout(
                schedule,
                2600 + Math.random() * 1800
            );
        }

        ambientTimer = window.setTimeout(schedule, 900);
    }

    function triggerTide() {
        if (!landing || !motionOn()) return;
        landing.classList.add("is-tide-out");
        if (tideTimer) window.clearTimeout(tideTimer);
        tideTimer = window.setTimeout(function () {
            landing.classList.remove("is-tide-out");
            tideTimer = null;
        }, 5200);
    }

    function waterPoint(event) {
        if (!landing) return null;
        var rect = landing.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null;
        return { x: x, y: y, height: rect.height };
    }

    function interactiveTarget(event) {
        var target = event.target;
        if (!target || !target.closest) return false;
        return !!target.closest("button, a, .theme-switcher");
    }

    if (landing) {
        landing.addEventListener("pointerdown", function (event) {
            if (!motionOn() || interactiveTarget(event)) return;
            var point = waterPoint(event);
            if (!point || point.y < point.height * 0.45) return;
            spawnRipple(
                point.x,
                point.y,
                event.pointerType === "touch" ? 1.25 : 1
            );
            triggerTide();
        });

        landing.addEventListener("pointermove", function (event) {
            if (!motionOn()) return;

            if (event.pointerType === "mouse") {
                var rect = landing.getBoundingClientRect();
                var px = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
                var py = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
                landing.style.setProperty("--px", px.toFixed(1) + "px");
                landing.style.setProperty("--py", py.toFixed(1) + "px");
            }

            if (event.pointerType !== "mouse") return;
            if (interactiveTarget(event)) return;
            var now = window.performance ? performance.now() : Date.now();
            if (now - lastMove < 90) return;
            lastMove = now;
            var point = waterPoint(event);
            if (!point || point.y < point.height * 0.55) return;
            spawnRipple(point.x, point.y, 0.55);
        });

        landing.addEventListener("pointerleave", function () {
            landing.style.setProperty("--px", "0px");
            landing.style.setProperty("--py", "0px");
        });

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        startAmbientRipples();
    }
})();

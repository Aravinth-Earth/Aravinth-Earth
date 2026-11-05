/* Timestamp Generator.
   The value is built from the device clock, so it follows the local time
   zone and daylight-saving rules. Nothing leaves the page. */
(function () {
    'use strict';

    var valueEl = document.getElementById('timestamp-value');
    var humanEl = document.getElementById('human-time');
    var timezoneEl = document.getElementById('timezone');
    var formatSelect = document.getElementById('format-select');
    var copyBtn = document.getElementById('copy-timestamp');
    var statusEl = document.getElementById('copy-status');

    if (!valueEl || !copyBtn || !statusEl) return;

    var savedFormat = null;
    try {
        savedFormat = localStorage.getItem('timestamp.format');
    } catch (e) {
        /* storage may be blocked; the default format still works */
    }
    if (formatSelect) {
        formatSelect.value = savedFormat === 'seconds' ? 'seconds' : 'ms';
    }

    var timezoneName = '';
    try {
        timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) {
        timezoneName = '';
    }

    var humanFormat = null;
    try {
        humanFormat = new Intl.DateTimeFormat(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (e) {
        humanFormat = null;
    }

    var copiedTimer = null;
    var holdValue = '';
    var holdUntil = 0;
    var withMilliseconds = !formatSelect || formatSelect.value !== 'seconds';
    var lastValue = '';
    var lastHumanSecond = -1;
    var lastTimezone = '';

    function pad(value, width) {
        var text = String(value);
        while (text.length < width) text = '0' + text;
        return text;
    }

    /** YYYYMMDDHHMMSS or YYYYMMDDHHMMSSZZZ, where ZZZ is milliseconds. */
    function formatStamp(date, includeMilliseconds) {
        var stamp = pad(date.getFullYear(), 4) +
            pad(date.getMonth() + 1, 2) +
            pad(date.getDate(), 2) +
            pad(date.getHours(), 2) +
            pad(date.getMinutes(), 2) +
            pad(date.getSeconds(), 2);
        if (includeMilliseconds) stamp += pad(date.getMilliseconds(), 3);
        return stamp;
    }

    function formatHuman(date) {
        return humanFormat ? humanFormat.format(date) : date.toLocaleString();
    }

    function formatTimezone(date) {
        var offset = -date.getTimezoneOffset();
        var sign = offset >= 0 ? '+' : '-';
        var absolute = Math.abs(offset);
        var hours = pad(Math.floor(absolute / 60), 2);
        var minutes = pad(absolute % 60, 2);
        var offsetText = 'UTC' + sign + hours + ':' + minutes;
        return timezoneName ? timezoneName + ' (' + offsetText + ')' : offsetText;
    }

    function render() {
        var now = new Date();
        var stamp;

        if (holdUntil && Date.now() < holdUntil) {
            stamp = holdValue;
        } else {
            holdUntil = 0;
            stamp = formatStamp(now, withMilliseconds);
        }

        // In seconds-only mode the value changes once a second, so skip the
        // DOM write on the other nineteen ticks.
        if (stamp !== lastValue) {
            valueEl.textContent = stamp;
            lastValue = stamp;
        }

        // The details section is secondary; refresh it once per second
        // instead of twenty times, and only when the text actually changes.
        var secondKey = Math.floor(now.getTime() / 1000);
        if (secondKey !== lastHumanSecond) {
            lastHumanSecond = secondKey;
            if (humanEl) humanEl.textContent = formatHuman(now);
            var timezone = formatTimezone(now);
            if (timezoneEl && timezone !== lastTimezone) {
                timezoneEl.textContent = timezone;
                lastTimezone = timezone;
            }
        }
    }

    function setStatus(message, isError) {
        statusEl.textContent = message;
        statusEl.classList.toggle('is-error', !!isError);
    }

    function saveFormat(value) {
        try {
            localStorage.setItem('timestamp.format', value);
        } catch (e) {
            /* storage may be blocked; the page still works for this visit */
        }
    }

    function selectValue() {
        try {
            var range = document.createRange();
            range.selectNodeContents(valueEl);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (e) {
            /* Selection is a fallback convenience, not a requirement. */
        }
    }

    /** Copy without the Clipboard API. No prompt, no alert. */
    function legacyCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        var copied = false;
        try {
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, text.length);
            copied = document.execCommand('copy');
        } catch (e) {
            copied = false;
        }

        textarea.remove();
        copyBtn.focus();
        return copied;
    }

    /** Resolves true when the browser accepted the clipboard write. */
    function writeToClipboard(text) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            return Promise.resolve(false);
        }
        if (window.isSecureContext === false) {
            return Promise.resolve(false);
        }
        try {
            return navigator.clipboard.writeText(text).then(
                function () { return true; },
                function () { return false; }
            );
        } catch (e) {
            return Promise.resolve(false);
        }
    }
    function copyNow() {
        var value = formatStamp(new Date(), withMilliseconds);

        // Show exactly the value that is about to be copied, and hold it
        // briefly so the number under the status message does not change
        // while the user is reading it.
        valueEl.textContent = value;
        lastValue = value;
        holdValue = value;
        holdUntil = Date.now() + 1400;

        writeToClipboard(value).then(function (copied) {
            if (!copied) copied = legacyCopy(value);

            if (!copied) {
                selectValue();
                setStatus(
                    'Could not copy automatically. The timestamp is selected — press Ctrl+C (⌘C on Mac).',
                    true
                );
                return;
            }

            setStatus('Copied ' + value + ' — ready to paste.');
            copyBtn.classList.add('is-copied');
            if (copiedTimer) window.clearTimeout(copiedTimer);
            copiedTimer = window.setTimeout(function () {
                copyBtn.classList.remove('is-copied');
            }, 1400);
        });
    }

    if (formatSelect) {
        formatSelect.addEventListener('change', function () {
            withMilliseconds = formatSelect.value !== 'seconds';
            saveFormat(formatSelect.value);
            holdUntil = 0;
            lastValue = '';
            setStatus('');
            render();
        });
    }

    copyBtn.addEventListener('click', copyNow);

    var timer = null;

    function startTimer() {
        if (timer || document.hidden) return;
        render();
        timer = window.setInterval(render, 50);
    }

    function stopTimer() {
        if (!timer) return;
        window.clearInterval(timer);
        timer = null;
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopTimer();
        else startTimer();
    });

    render();
    startTimer();
})();

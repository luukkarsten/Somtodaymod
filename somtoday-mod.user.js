// ==UserScript==
// @name         SomtodayMod Ultimate Edition
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Custom names, Cijfer Shield, live countdowns, and real-time class progress trackers.
// @author       You
// @match        *://leerling.somtoday.nl/rooster
// @grant        none
// @run-at       document-end
// ==/UserScript==






(function() {
    'use strict';

    // 1. Storage Initialization & Fallback fallbacks
    if (!localStorage.getItem('customSubjects')) {
        var defaultSubjects = {
            "ne": "Nederlands 📖",
            "en": "Engels 🇬🇧",
            "wis": "Wiskunde 📐"
        };
        localStorage.setItem('customSubjects', JSON.stringify(defaultSubjects));
    }

    window.subMap = JSON.parse(localStorage.getItem('customSubjects'));

    window.plaMap = {
        "001": "De Chillruimte 🛋️",
        "102": "De Computer Lab 💻",
        "aud": "De Grote Aula 🏛️"
    };

    window.dayMap = {
        "maandag": "Saaie Maandag 🥱",
        "dinsdag": "Lange Dinsdag ⏳",
        "woensdag": "Breek-de-Week Woensdag 🧭",
        "donderdag": "Bijna-Weekend Donderdag ⚡",
        "vrijdag": "Mooie Vrijdag 🎉"
    };

    window.modActive = localStorage.getItem('modActive') !== 'false';
    window.censorActive = localStorage.getItem('censorActive') !== 'false';
    window.censorLimit = parseFloat(localStorage.getItem('censorLimit') || '5.5');
    window.replaceTextOnPage = function() {
        if (window.modActive) {
            // Swap Subject Names
            document.querySelectorAll("div.titel").forEach(function(e) {
                if (!e.dataset.original) e.dataset.original = e.innerText.trim().toLowerCase();
                var lookupText = e.dataset.original;
                if (window.subMap.hasOwnProperty(lookupText) && e.innerText !== window.subMap[lookupText]) {
                    e.innerText = window.subMap[lookupText];
                }
            });

            // Swap Room Locations
            document.querySelectorAll("div.locatie.label.ng-star-inserted").forEach(function(e) {
                if (!e.dataset.original) e.dataset.original = e.innerText.trim();
                var originalText = e.dataset.original;
                var lowerText = originalText.toLowerCase();
                if (window.plaMap.hasOwnProperty(lowerText)) {
                    if (e.innerText !== window.plaMap[lowerText]) e.innerText = window.plaMap[lowerText];
                } else if (/^\d{3}A$/.test(originalText)) {
                    var targetRegexText = "in het ander gebouw " + originalText;
                    if (e.innerText !== targetRegexText) e.innerText = targetRegexText;
                }
            });

            // Swap Day Names
            document.querySelectorAll("div.dag.ng-star-inserted p").forEach(function(p) {
                if (!p.dataset.original) p.dataset.original = p.innerText.trim().toLowerCase();
                var fullText = p.dataset.original;
                Object.keys(window.dayMap).forEach(function(key) {
                    if (fullText.includes(key)) {
                        var dateMatch = fullText.match(/\d+$/);
                        var dateNumber = dateMatch ? dateMatch[0] : "";
                        var expectedHTML = dateNumber ? window.dayMap[key] + "&nbsp;<span>" + dateNumber + "</span>" : window.dayMap[key];
                        if (p.innerHTML !== expectedHTML) p.innerHTML = expectedHTML;
                    }
                });
            });
        }
    };
    function generateDynamicPassingGrade(limit) {
        var baseInteger = Math.floor(limit);
        var minFake = baseInteger + 1;
        var maxFake = baseInteger + 2;
        if (minFake > 9) minFake = 9;
        if (maxFake > 10) maxFake = 10;
        if (minFake === maxFake) minFake = maxFake - 1;
        var randomNum = (Math.random() * (maxFake - minFake) + minFake).toFixed(1);
        return randomNum.replace('.', ',');
    }

    window.runCijferShield = function() {
        document.querySelectorAll("span.cijfer").forEach(function(g) {
            if (!g.dataset.realGrade) g.dataset.realGrade = g.innerText.trim();
            var txt = g.dataset.realGrade.replace(',', '.');
            var gradeNum = parseFloat(txt);
            if (!isNaN(gradeNum) && window.censorActive && gradeNum < window.censorLimit) {
                if (g.dataset.appliedLimit !== String(window.censorLimit)) {
                    g.dataset.fakeText = generateDynamicPassingGrade(window.censorLimit);
                    g.dataset.appliedLimit = String(window.censorLimit);
                }
                if (!g.dataset.hasHoverEvents) {
                    g.style.transition = "color 0.1s ease"; g.dataset.hasHoverEvents = "true";
                    g.addEventListener('mouseenter', function() { g.innerText = g.dataset.realGrade; g.style.setProperty('color', '', 'important'); });
                    g.addEventListener('mouseleave', function() { if(window.censorActive) { g.innerText = g.dataset.fakeText; g.style.setProperty('color', '#00aa00', 'important'); } });
                }
                if (g.innerText !== g.dataset.fakeText && document.activeElement !== g) {
                    g.innerText = g.dataset.fakeText; g.style.setProperty('color', '#00aa00', 'important');
                }
            } else {
                if (g.innerText !== g.dataset.realGrade) { g.innerText = g.dataset.realGrade; g.style.setProperty('color', '', 'important'); }
            }
        });
    };
// ==========================================
    // PART 3A-1: PROMPT-DRIVEN LINK HUB
    // ==========================================
    window.quickLinks = JSON.parse(localStorage.getItem('modQuickLinks')) || [];

    window.showLinkHub = function() {
        var menuText = "🚀 SNELKOPPELINGEN HUB\n\n";
        if (window.quickLinks.length === 0) {
            menuText += "(Geen links opgeslagen)\n";
        } else {
            window.quickLinks.forEach(function(link, idx) {
                menuText += (idx + 1) + ": Open " + link.name + " (" + link.url + ")\n";
            });
        }
        menuText += "\nTyp het nummer om te openen.\nOf typ:\n[ + ] om link toe te voegen\n[ - ] om link te verwijderen";

        var input = prompt(menuText);
        if (!input) return;
        var cleanInput = input.trim();

        if (cleanInput === "+") {
            var name = prompt("Naam van de website:");
            if (!name) return;
            var url = prompt("URL van de website (inclusief https://):", "https://");
            if (!url || url === "https://") return;
            window.quickLinks.push({ name: name.trim(), url: url.trim() });
            localStorage.setItem('modQuickLinks', JSON.stringify(window.quickLinks));
            window.showLinkHub();
        } else if (cleanInput === "-") {
            if (window.quickLinks.length === 0) return;
            var removeIdx = parseInt(prompt("Welk nummer verwijderen?"), 10) - 1;
            if (isNaN(removeIdx) || removeIdx < 0 || removeIdx >= window.quickLinks.length) return;
            window.quickLinks.splice(removeIdx, 1);
            localStorage.setItem('modQuickLinks', JSON.stringify(window.quickLinks));
            window.showLinkHub();
        } else {
            var targetIdx = parseInt(cleanInput, 10) - 1;
            if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx < window.quickLinks.length) {
                window.open(window.quickLinks[targetIdx].url, '_blank');
            }
        }
    };

    function showPromptMenu() {
        var menuText = "Kies het nummer van het vak:\n\n";
        var keysArray = Object.keys(window.subMap);
        var indexCounter = 1;
        keysArray.forEach(function(key) { menuText += indexCounter + ": " + window.subMap[key] + "\n"; indexCounter++; });
        var selection = prompt(menuText);
        if (!selection) return;
        var selectedIndex = parseInt(selection.trim(), 10) - 1;
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= keysArray.length) return;
        var originalKey = keysArray[selectedIndex];
        var newName = prompt("Nieuwe naam voor '" + window.subMap[originalKey] + "'?");
        if (!newName) return;
        window.subMap[originalKey] = newName.trim();
        localStorage.setItem('customSubjects', JSON.stringify(window.subMap));
        window.replaceTextOnPage();
    }

// ==========================================================================
    // PART 3B: UNIFIED DRAGGABLE CORE, RUNNER ENGINE & INTERACTIVE GUI PANEL
    // ==========================================================================

    window.changeHolidayDate = function() {
        var currentTarget = localStorage.getItem('vacationTargetDate') || "July 5, 2026 15:00:00";
        var newDate = prompt("Voer nieuwe vakantiedatum in:\nVoorbeeld: July 5, 2026 15:00:00", currentTarget);
        if (newDate && !isNaN(Date.parse(newDate.trim()))) {
            localStorage.setItem('vacationTargetDate', newDate.trim());
        }
    };

    window.changeSchoolEndTime = function() {
        var currentEndTime = localStorage.getItem('schoolEndTime') || "15:45";
        var newTime = prompt("Hoe laat is je laatste les afgelopen vandaag? (HH:MM)", currentEndTime);
        if (newTime && /^\d{1,2}:\d{2}$/.test(newTime.trim())) {
            localStorage.setItem('schoolEndTime', newTime.trim());
        }
    };

    // New Function: Change the banner text live on screen
    window.changeMotivationText = function() {
        var currentBanner = localStorage.getItem('customMotivationText') || "";
        var newBanner = prompt("Voer een aangepaste motivatie-tekst in:\n(Laat leeg om terug te gaan naar willekeurige quotes)", currentBanner);

        if (newBanner !== null) {
            var trimmed = newBanner.trim();
            if (trimmed === "") {
                localStorage.removeItem('customMotivationText');
            } else {
                localStorage.setItem('customMotivationText', trimmed);
            }
            // Instantly update the display text if the element exists
            var bannerEl = document.getElementById("mod-motivation-banner");
            if (bannerEl) {
                bannerEl.innerText = trimmed || window.getRandomQuote();
            }
        }
    };

    // --- Drag and Drop State Elements ---
    var p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    var dragTargetElement = null;

    function elementDrag(e) {
        if (!dragTargetElement) return;
        var eventObj = e || window.event;
        eventObj.preventDefault();
        p1 = p3 - eventObj.clientX;
        p2 = p4 - eventObj.clientY;
        p3 = eventObj.clientX;
        p4 = eventObj.clientY;

        var newTop = dragTargetElement.offsetTop - p2;
        var newLeft = dragTargetElement.offsetLeft - p1;
        dragTargetElement.style.top = newTop + "px";
        dragTargetElement.style.left = newLeft + "px";
        dragTargetElement.style.bottom = "auto";
        dragTargetElement.style.right = "auto";

        localStorage.setItem('timerDragTop', newTop);
        localStorage.setItem('timerDragLeft', newLeft);
    }

    function closeDragElement() {
        dragTargetElement = null;
        document.onmouseup = null;
        document.onmousemove = null;
    }

    function makeElementDraggable(el) {
        el.onmousedown = function(e) {
            var eventObj = e || window.event;
            if (eventObj.target !== el) return;
            eventObj.preventDefault();
            dragTargetElement = el;
            p3 = eventObj.clientX;
            p4 = eventObj.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };
    }

    // --- Core UI Calculators ---
    window.updateFreedomTimer = function() {
        var timerBox = document.getElementById("freedom-timer-box");
        if (!timerBox) {
            timerBox = document.createElement("div"); timerBox.id = "freedom-timer-box";
            var sTop = localStorage.getItem('timerDragTop'), sLeft = localStorage.getItem('timerDragLeft');
            var pos = "position:fixed; z-index:2147483647; padding:12px 20px; background:#111; color:#00ffcc; border-radius:10px; font-weight:bold; font-family:monospace; font-size:14px; box-shadow:0 4px 15px rgba(0,0,0,0.5); cursor:move; user-select:none;";
            timerBox.style = pos + (sTop && sLeft ? "top:" + sTop + "px; left:" + sLeft + "px;" : "bottom:75px; right:20px;");
            timerBox.title = "Slepen om te verplaatsen\nDubbelklik of druk Alt+T voor instellingen";
            timerBox.addEventListener("dblclick", window.changeSchoolEndTime);
            document.body.appendChild(timerBox);
            makeElementDraggable(timerBox);
        }

        var now = new Date(), currentDayIndex = now.getDay() - 1;
        if (currentDayIndex < 0 || currentDayIndex > 4) {
            timerBox.innerText = "JE BENT VRIJ! 🎉"; timerBox.style.color = "#00ff00"; return;
        }

        var currentTotalMins = (now.getHours() * 60) + now.getMinutes();
        document.querySelectorAll(".live-lesson-progress").forEach(function(el) { el.remove(); });

        var timetable = [
            { hour: 1, start: "08:45", end: "09:30" }, { hour: 2, start: "09:30", end: "10:15" },
            { hour: 3, start: "10:30", end: "11:15" }, { hour: 4, start: "11:15", end: "12:00" },
            { hour: 5, start: "12:30", end: "13:15" }, { hour: 6, start: "13:15", end: "14:00" },
            { hour: 7, start: "14:15", end: "15:00" }, { hour: 8, start: "15:00", end: "15:45" }
        ];

        var curH = null, curPct = 0;
        for (var i = 0; i < timetable.length; i++) {
            var s = timetable[i].start.split(":"), e = timetable[i].end.split(":");
            var sM = (parseInt(s[0], 10) * 60) + parseInt(s[1], 10), eM = (parseInt(e[0], 10) * 60) + parseInt(e[1], 10);
            if (currentTotalMins >= sM && currentTotalMins < eM) {
                curH = timetable[i]; curPct = Math.floor(((currentTotalMins - sM) / (eM - sM)) * 100); break;
            }
        }

        if (curH !== null) {
            var dayCols = document.querySelectorAll("sl-rooster-dag") || document.querySelectorAll("[class*='rooster']");
            if (dayCols && dayCols.length > currentDayIndex) {
                var appointments = dayCols[currentDayIndex].querySelectorAll("sl-afspraak") || dayCols[currentDayIndex].querySelectorAll("[class*='afspraak']");
                for (var j = 0; j < appointments.length; j++) {
                    var card = appointments[j], cardText = card.innerText || "";
                    if (new RegExp("\\b" + curH.hour + "(e|u)?\\b", "i").test(cardText) || j === (curH.hour - 1)) {
                        var div = document.createElement("div"); div.className = "live-lesson-progress";
                        div.style = "color:#00ffcc !important;font-family:monospace !important;font-size:11px !important;margin-top:4px !important;font-weight:bold !important;display:block !important;";
                        div.innerText = "[" + "█".repeat(Math.round((curPct / 100) * 10)) + "░".repeat(10 - Math.round((curPct / 100) * 10)) + "] " + curPct + "% doorstaan";
                        var c = card.querySelector(".container") || card.querySelector("[class*='container']") || card;
                        if (c) { c.appendChild(div); break; }
                    }
                }
            }
        }

        var timeParts = (localStorage.getItem('schoolEndTime') || "15:45").split(":");
        var diff = ((parseInt(timeParts[0], 10) * 3600) + (parseInt(timeParts[1], 10) * 60)) - ((now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds());
        if (diff <= 0) { timerBox.innerText = "JE BENT VRIJ! 🎉"; timerBox.style.color = "#00ff00"; }
        else { timerBox.innerText = "Vrij over: " + (Math.floor(diff / 3600) > 0 ? Math.floor(diff / 3600) + "u " : "") + Math.floor((diff % 3600) / 60) + "m " + (diff % 60 < 10 ? "0" : "") + (diff % 60) + "s"; timerBox.style.color = "#00ffcc"; }
    };

    window.updateVacationCountdown = function() {
        var timerDisplay = document.getElementById("vacation-timer"); if (!timerDisplay) return;
        var targetDate = new Date(localStorage.getItem('vacationTargetDate') || "July 5, 2026 15:00:00"), now = new Date();
        if (isNaN(targetDate.getTime())) { timerDisplay.innerText = "🌴 Datumfout! Klik of Alt+L"; return; }
        if (targetDate.getTime() - now.getTime() < 0) { timerDisplay.innerText = "ZOMERVAKANTIE! ☀️"; timerDisplay.style.color = "#00ff00"; return; }

        var schoolDays = 0, loop = new Date(now.getTime()); loop.setHours(0,0,0,0);
        while (loop < targetDate) {
            if (loop.getDay() !== 0 && loop.getDay() !== 6) schoolDays++;
            loop.setDate(loop.getDate() + 1);
        }
        if (schoolDays <= 0) {
            var diffS = Math.floor((targetDate.getTime() - now.getTime()) / 1000);
            timerDisplay.innerText = "🌴 Nog " + Math.floor(diffS / 3600) + "u " + Math.floor((diffS % 3600) / 60) + "m tot vakantie!";
        } else { timerDisplay.innerText = "🌴 Nog " + schoolDays + " schooldagen te gaan!"; }
    };

    // --- Motivation Banner Config ---
    var quotes = [
        "Focus op de vooruitgang, niet op de perfectie! ⚡",
        "Elk uur dat je doorstaat brengt je dichter bij het weekend! ☕",
        "Laat je cijfers niet je humeur bepalen. Kop op! 💪",
        "Zet hem op vandaag, je kunt dit makkelijk aan! 🔥",
        "Nog even volhouden, de vakantie komt steeds dichterbij! 🌴",
        "Blijf gefocust. Succes is de som van kleine inspanningen! 🎓"
    ];

    window.getRandomQuote = function() {
        if (!window.cachedQuote) {
            window.cachedQuote = quotes[Math.floor(Math.random() * quotes.length)];
        }
        return window.cachedQuote;
    };

    // Determine starting text string
    var initialText = localStorage.getItem('customMotivationText') || window.getRandomQuote();

    // --- Bottom Layout Management Panel ---
    window.guiVisible = true;

    function buildGUI() {
        var existingGui = document.getElementById("somtoday-mod-gui");

        if (!window.guiVisible) {
            if (existingGui) existingGui.remove();
            return;
        }

        if (existingGui) return;

        var isModActive = (window.modActive !== false);
        var isCensorActive = (window.censorActive !== false);
        var currentLimit = window.censorLimit || 5.5;

        var gui = document.createElement("div");
        gui.id = "somtoday-mod-gui";
        gui.style = "position:fixed !important;bottom:0 !important;left:0 !important;width:100% !important;height:60px !important;background:#111111 !important;border-top:3px solid #00ffcc !important;display:flex !important;align-items:center !important;justify-content:space-between !important;padding:0 30px !important;box-sizing:border-box !important;z-index:2147483647 !important;color:#ffffff !important;font-family:Segoe UI, sans-serif !important;font-size:14px !important;box-shadow:0 -5px 15px rgba(0,0,0,0.6) !important;";

        var htmlContent = '';
        htmlContent += '<div style="font-weight:bold;color:#00ffcc;font-size:15px;margin:0;">SomtodayMod v3.0</div>';

        // Render current active layout banner
        htmlContent += '<div id="mod-motivation-banner" title="Dubbelklik of druk Alt+B om aan te passen" style="font-style:italic;color:#aaaaaa;font-size:13px;text-align:center;flex-grow:1;margin:0 20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;">' + initialText + '</div>';

        htmlContent += '<div style="display:flex;align-items:center;gap:20px;margin:0;">';
        htmlContent += '  <label style="display:flex;align-items:center;cursor:pointer;margin:0;color:#fff;"><input type="checkbox" id="toggle-names" ' + (isModActive ? 'checked' : '') + ' style="margin:0 6px 0 0;width:15px;height:15px;accent-color:#00ffcc;"> Custom Namen</label>';
        htmlContent += '  <label style="display:flex;align-items:center;cursor:pointer;margin:0;color:#fff;"><input type="checkbox" id="toggle-censor" ' + (isCensorActive ? 'checked' : '') + ' style="margin:0 6px 0 0;width:15px;height:15px;accent-color:#00ffcc;"> Cijfer Shield</label>';
        htmlContent += '  <div style="display:flex;align-items:center;gap:6px;color:#fff;margin:0;">Limiet: <input type="number" id="num-limit" value="' + currentLimit + '" step="0.1" min="1.0" max="10.0" style="width:52px;height:26px;background:#222;color:#00ffcc;border:1px solid #00ffcc;border-radius:6px;text-align:center;font-weight:bold;font-size:13px;outline:none;margin:0;"></div>';
        htmlContent += '</div>';
        htmlContent += '<div style="display:flex;align-items:center;gap:12px;margin-left:20px;">';
        htmlContent += '  <button id="gui-hub-btn" style="background:#222;color:#00ffcc;border:1px solid #00ffcc;padding:6px 14px;border-radius:6px;font-weight:bold;font-size:12px;cursor:pointer;margin:0;">Links [Alt+H]</button>';
        htmlContent += '  <div id="vacation-timer" style="color:#00ffcc;font-family:monospace;font-size:13px;font-weight:bold;margin:0;cursor:pointer;">Timer... [Alt+L]</div>';
        htmlContent += '  <button id="gui-edit-btn" style="background:#00ffcc;color:#111;border:none;padding:6px 14px;border-radius:6px;font-weight:bold;font-size:12px;cursor:pointer;margin:0;">Bewerk Vakken [Alt+S]</button>';
        htmlContent += '</div>';

        gui.innerHTML = htmlContent;
        document.body.appendChild(gui);

        document.getElementById("toggle-names").addEventListener("change", function(e) { window.modActive = e.target.checked; localStorage.setItem('modActive', window.modActive); if(typeof window.replaceTextOnPage === "function") window.replaceTextOnPage(); });
        document.getElementById("toggle-censor").addEventListener("change", function(e) { window.censorActive = e.target.checked; localStorage.setItem('censorActive', window.censorActive); if(typeof window.runCijferShield === "function") window.runCijferShield(); });
        document.getElementById("num-limit").addEventListener("input", function(e) { var val = parseFloat(e.target.value); if(!isNaN(val)) { window.censorLimit = val; localStorage.setItem('censorLimit', window.censorLimit); if(typeof window.runCijferShield === "function") window.runCijferShield(); } });
        document.getElementById("gui-edit-btn").addEventListener("click", function() { if(typeof showPromptMenu === "function") showPromptMenu(); });
        document.getElementById("gui-hub-btn").addEventListener("click", function() { if(typeof window.showLinkHub === "function") window.showLinkHub(); });
        document.getElementById("vacation-timer").addEventListener("click", function() { if(typeof window.changeHolidayDate === "function") window.changeHolidayDate(); });
        document.getElementById("mod-motivation-banner").addEventListener("dblclick", window.changeMotivationText);
    }

    // --- Input Listener Handlers ---
    window.addEventListener('keydown', function(e) {
        var key = e.key.toLowerCase();

        if (e.altKey && (key === 'g' || e.keyCode === 71)) {
            e.preventDefault();
            window.guiVisible = !window.guiVisible;
            buildGUI();
        }
        if (e.altKey && (key === 'b' || e.keyCode === 66)) { // New Key Shortcut: Alt + B
            e.preventDefault();
            if (typeof window.changeMotivationText === "function") window.changeMotivationText();
        }
        if (e.altKey && (key === 'l' || e.keyCode === 76)) {
            e.preventDefault();
            if (typeof window.changeHolidayDate === "function") window.changeHolidayDate();
        }
        if (e.altKey && (key === 's' || e.keyCode === 83)) {
            e.preventDefault();
            if (typeof showPromptMenu === "function") showPromptMenu();
        }
        if (e.altKey && (key === 't' || e.keyCode === 84)) {
            e.preventDefault();
            if (typeof window.changeSchoolEndTime === "function") window.changeSchoolEndTime();
        }
        if (e.altKey && (key === 'h' || e.keyCode === 72)) {
            e.preventDefault();
            if (typeof window.showLinkHub === "function") window.showLinkHub();
        }
    });

    // --- Master Loop Sync Trigger ---
    setInterval(function() {
        buildGUI();
        if (typeof window.replaceTextOnPage === "function") window.replaceTextOnPage();
        if (typeof window.runCijferShield === "function") window.runCijferShield();
        if (typeof window.updateFreedomTimer === "function") window.updateFreedomTimer();
        if (typeof window.updateVacationCountdown === "function") window.updateVacationCountdown();
    }, 100);
})();

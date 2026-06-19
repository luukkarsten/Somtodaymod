// ==UserScript==
// @name         Somtoday Utility Mod
// @namespace    http://tampermonkey.net/
// @version      3.0
// @match        https://*.somtoday.nl/*
// @grant        none
// @description  yeah boiiiii
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================================================
    // PART 1: GLOBAL CONFIGURATION, CONFIG STATE DATA & DATA MAPS
    // ==========================================================================

    window.initializeSubjectMap = function() {
        var saved = localStorage.getItem('customSubjectMap');
        if (saved) {
            try {
                return new Map(JSON.parse(saved));
            } catch(e) {
                var obj = JSON.parse(saved);
                var entries = [];
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) entries.push([key, obj[key]]);
                }
                return new Map(entries);
            }
        }
        return new Map([
            ["Franse taal", "Frans 🇫🇷"],
            ["wiskunde", "Wiskunde 📐"],
            ["Nederlandse taal", "Nederlands 🇳🇱"],
            ["Godsdienst en levensbeschouwing", "Levensbeschouwing 🕊️"],
            ["geschiedenis", "Geschiedenis ⏳"],
            ["economie", "Economie 📊"],
            ["natuurkunde", "Natuurkunde 🧲"],
            ["scheikunde", "Scheikunde 🧪"],
            ["Duitse taal", "Onvoldoende halen"],
            ["Engelse taal", "Engels 🇬🇧"],
            ["mentorles", "Mentorles 👥"],
            ["aardrijkskunde", "Aardrijkskunde 🌍"],
            ["wetenschap & techniek", "W&T 🛠️"],
            ["Thema beeldend", "Beeldend 🎨"]
        ]);
    };

    window.subMap = window.initializeSubjectMap();

    window.modActive = localStorage.getItem('modActive') !== 'false';
    window.censorActive = localStorage.getItem('censorActive') !== 'false';
    window.censorLimit = parseFloat(localStorage.getItem('censorLimit')) || 5.5;


   // ==========================================================================
    // PART 3B: UNIFIED DRAGGABLE CORE, RUNNER ENGINE & INTERACTIVE GUI PANEL
    // ==========================================================================

    window.replaceTextOnPage = function() {
        if (window.modActive === false) return;

        window.subMap.forEach(function(customName, shortCode) {
            var elements = document.querySelectorAll(".vak, [class*='vak'], .subject, td, span, div, h4, p, appointment, sl-afspraak");

            elements.forEach(function(el) {
                var txt = el.textContent || el.innerText;
                if (txt && txt.trim().toLowerCase() === shortCode.toLowerCase()) {
                    el.textContent = customName;
                }
                else if (txt && txt.includes(shortCode) && !txt.includes(customName)) {
                    if (el.children.length === 0) {
                        el.textContent = txt.split(shortCode).join(customName);
                    }
                }
            });
        });
    };

    // --- Custom Name Dropdown Selection Menu Panel (Absolute Top Layer Force) ---
    // --- Custom Name Index Reference System ---
    window.showPromptMenu = function() {
        var existing = document.getElementById("mod-menu-popup");
        if (existing) existing.remove();

        var popup = document.createElement("div");
        popup.id = "mod-menu-popup";

        // Solid layer force properties
        popup.style.setProperty("position", "fixed", "important");
        popup.style.setProperty("top", "50%", "important");
        popup.style.setProperty("left", "50%", "important");
        popup.style.setProperty("transform", "translate(-50%, -50%)", "important");
        popup.style.setProperty("z-index", "2147483647", "important");
        popup.style.setProperty("background", "#1e1e1e", "important");
        popup.style.setProperty("border", "2px solid #00ffcc", "important");
        popup.style.setProperty("border-radius", "12px", "important");
        popup.style.setProperty("padding", "20px", "important");
        popup.style.setProperty("box-shadow", "0 10px 30px rgba(0,0,0,0.8)", "important");
        popup.style.setProperty("font-family", "Segoe UI, sans-serif", "important");
        popup.style.setProperty("color", "#ffffff", "important");
        popup.style.setProperty("width", "340px", "important");
        popup.style.setProperty("display", "flex", "important");
        popup.style.setProperty("flex-direction", "column", "important");
        popup.style.setProperty("gap", "12px", "important");

        var title = document.createElement("h3");
        title.innerText = "Bewerk Vaknaam";
        title.style = "margin:0; color:#00ffcc; font-size:16px; text-align:center; font-weight:bold;";
        popup.appendChild(title);

        // --- 1. Cross Reference List Box ---
        var listContainer = document.createElement("div");
        listContainer.style = "background:#292929; border:1px solid #444; border-radius:6px; padding:10px; max-height:160px; overflow-y:auto; font-size:12px; font-family:monospace; color:#ccc;";

        // Convert map to array to give each item a clear index number
        var subjectArray = Array.from(window.subMap.keys());
        subjectArray.forEach(function(key, index) {
            var item = document.createElement("div");
            item.style = "padding:2px 0; border-bottom:1px solid #333;";
            item.innerText = "[" + (index + 1) + "] " + key;
            listContainer.appendChild(item);
        });
        popup.appendChild(listContainer);

        // --- 2. Number Picker Input ---
        var numLabel = document.createElement("label");
        numLabel.innerText = "Voer het nummer in van het vak:";
        numLabel.style = "font-size:11px; color:#aaa; margin:0;";
        popup.appendChild(numLabel);

        var numInput = document.createElement("input");
        numInput.type = "number";
        numInput.min = "1";
        numInput.max = subjectArray.length.toString();
        numInput.placeholder = "bijv. 1";
        numInput.style = "background:#2b2b2b; color:#fff; border:1px solid #555; padding:6px; border-radius:6px; outline:none; font-size:13px; width:100%; box-sizing:border-box;";
        popup.appendChild(numInput);

        // --- 3. New Nickname Input ---
        var textLabel = document.createElement("label");
        textLabel.innerText = "Nieuwe weergavenaam:";
        textLabel.style = "font-size:11px; color:#aaa; margin:0;";
        popup.appendChild(textLabel);

        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "bijv. Duits 🇩🇪";
        nameInput.style = "background:#2b2b2b; color:#00ffcc; border:1px solid #00ffcc; padding:6px; border-radius:6px; outline:none; font-size:13px; font-weight:bold; width:100%; box-sizing:border-box;";
        popup.appendChild(nameInput);

        // Automatically pre-fill the name field if they change the selection index number
        numInput.addEventListener("input", function() {
            var idx = parseInt(numInput.value, 10) - 1;
            if (idx >= 0 && idx < subjectArray.length) {
                var chosenKey = subjectArray[idx];
                nameInput.value = window.subMap.get(chosenKey) || chosenKey;
            } else {
                nameInput.value = "";
            }
        });

        // --- 4. Action Buttons ---
        var btnRow = document.createElement("div");
        btnRow.style = "display:flex; justify-content:space-between; margin-top:8px; gap:10px;";

        var cancelBtn = document.createElement("button");
        cancelBtn.innerText = "Annuleren";
        cancelBtn.style = "background:#444; color:#fff; border:none; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer; flex:1; font-size:12px;";
        cancelBtn.onclick = function() { popup.remove(); };

        var saveBtn = document.createElement("button");
        saveBtn.innerText = "Opslaan";
        saveBtn.style = "background:#00ffcc; color:#111; border:none; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer; flex:1; font-size:12px;";
        saveBtn.onclick = function() {
            var idx = parseInt(numInput.value, 10) - 1;
            var newName = nameInput.value.trim();

            if (idx >= 0 && idx < subjectArray.length && newName) {
                var selectedKey = subjectArray[idx];
                window.subMap.set(selectedKey, newName);
                localStorage.setItem('customSubjectMap', JSON.stringify(Array.from(window.subMap.entries())));
                if (typeof window.replaceTextOnPage === "function") {
                    window.replaceTextOnPage();
                }
            }
            popup.remove();
        };

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(saveBtn);
        popup.appendChild(btnRow);

        document.body.appendChild(popup);
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
            timerBox = document.createElement("div");
            timerBox.id = "freedom-timer-box";
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
            timerBox.innerText = "JE BENT VRIJ! 🎉";
            timerBox.style.color = "#00ff00";
            return;
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
                curH = timetable[i];
                curPct = Math.floor(((currentTotalMins - sM) / (eM - sM)) * 100);
                break;
            }
        }

        if (curH !== null) {
            var dayCols = document.querySelectorAll("sl-rooster-dag") || document.querySelectorAll("[class*='rooster']");
            if (dayCols && dayCols.length > currentDayIndex) {
                var appointments = dayCols[currentDayIndex].querySelectorAll("sl-afspraak") || dayCols[currentDayIndex].querySelectorAll("[class*='afspraak']");
                for (var j = 0; j < appointments.length; j++) {
                    var card = appointments[j], cardText = card.innerText || "";
                    if (new RegExp("\\b" + curH.hour + "(e|u)?\\b", "i").test(cardText) || j === (curH.hour - 1)) {
                        var div = document.createElement("div");
                        div.className = "live-lesson-progress";
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
        if (diff <= 0) {
            timerBox.innerText = "JE BENT VRIJ! 🎉";
            timerBox.style.color = "#00ff00";
        } else {
            timerBox.innerText = "Vrij over: " + (Math.floor(diff / 3600) > 0 ? Math.floor(diff / 3600) + "u " : "") + Math.floor((diff % 3600) / 60) + "m " + (diff % 60 < 10 ? "0" : "") + (diff % 60) + "s";
            timerBox.style.color = "#00ffcc";
        }
    };

    window.updateVacationCountdown = function() {
        var timerDisplay = document.getElementById("vacation-timer");
        if (!timerDisplay) return;
        var targetDate = new Date(localStorage.getItem('vacationTargetDate') || "July 5, 2026 15:00:00"), now = new Date();
        if (isNaN(targetDate.getTime())) {
            timerDisplay.innerText = "🌴 Datumfout! Klik of Alt+L";
            return;
        }
        if (targetDate.getTime() - now.getTime() < 0) {
            timerDisplay.innerText = "ZOMERVAKANTIE! ☀️";
            timerDisplay.style.color = "#00ff00";
            return;
        }

        var schoolDays = 0, loop = new Date(now.getTime());
        loop.setHours(0,0,0,0);
        while (loop < targetDate) {
            if (loop.getDay() !== 0 && loop.getDay() !== 6) schoolDays++;
            loop.setDate(loop.getDate() + 1);
        }
        if (schoolDays <= 0) {
            var diffS = Math.floor((targetDate.getTime() - now.getTime()) / 1000);
            timerDisplay.innerText = "🌴 Nog " + Math.floor(diffS / 3600) + "u " + Math.floor((diffS % 3600) / 60) + "m tot vakantie!";
        } else {
            timerDisplay.innerText = "🌴 Nog " + schoolDays + " schooldagen te gaan!";
        }
    };

    window.runCijferShield = function() {
        if (window.censorActive === false) {
            document.querySelectorAll(".cijfer-shield-covered").forEach(function(el) {
                el.style.background = "none";
                el.style.color = "";
                el.classList.remove("cijfer-shield-covered");
            });
            return;
        }

        var limit = window.censorLimit || 5.5;
        var gradeElements = document.querySelectorAll(".cijfer, [class*='cijfer'], .grade");

        gradeElements.forEach(function(el) {
            if (el.matches(':hover')) return;

            var val = parseFloat(el.innerText.replace(',', '.'));
            if (!isNaN(val) && val < limit) {
                el.classList.add("cijfer-shield-covered");
                el.style.background = "#00ffcc";
                el.style.color = "#00ffcc";
                el.style.borderRadius = "4px";
                el.style.transition = "background 0.2s, color 0.2s";
            }
        });
    };

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

    var initialText = localStorage.getItem('customMotivationText') || window.getRandomQuote();
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
        htmlContent += '<div id="mod-motivation-banner" title="Dubbelklik of druk Alt+B om aan te passen" style="font-style:italic;color:#aaaaaa;font-size:13px;text-align:center;flex-grow:1;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;">' + initialText + '</div>';

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
        document.getElementById("gui-edit-btn").addEventListener("click", function() { window.showPromptMenu(); });
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
        if (e.altKey && (key === 'b' || e.keyCode === 66)) {
            e.preventDefault();
            if (typeof window.changeMotivationText === "function") window.changeMotivationText();
        }
        if (e.altKey && (key === 'l' || e.keyCode === 76)) {
            e.preventDefault();
            if (typeof window.changeHolidayDate === "function") window.changeHolidayDate();
        }
        if (e.altKey && (key === 's' || e.keyCode === 83)) {
            e.preventDefault();
            window.showPromptMenu();
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

    // --- Master Loop Sync Trigger (Crash-Safe Wrapper) ---
    setInterval(function() {
        try {
            buildGUI();
            if (typeof window.replaceTextOnPage === "function") window.replaceTextOnPage();
            if (typeof window.runCijferShield === "function") window.runCijferShield();
            if (typeof window.updateFreedomTimer === "function") window.updateFreedomTimer();
            if (typeof window.updateVacationCountdown === "function") window.updateVacationCountdown();
        } catch (err) {
            // Catches any missing part errors safely so layout click handlers don't crash
        }
    }, 100);

})();

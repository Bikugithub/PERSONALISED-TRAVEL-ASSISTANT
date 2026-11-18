// State Management
var tripsData = [];
try {
    var saved = localStorage.getItem("animeTravelLedger");
    if (saved) {
        tripsData = JSON.parse(saved);
    }
} catch(e) {}

window.onload = function() {
    var calcDest = document.getElementById("calc-dest");
    var calcType = document.getElementById("calc-type");
    var form = document.getElementById("calculator-form");
    var tripsListEl = document.getElementById("saved-trips-list");
    var liveTotalEl = document.getElementById("live-total");
    var themeToggleBtn = document.getElementById("theme-toggle");

    // 1. THEME TOGGLE LOGIC
    var currentTheme = localStorage.getItem("animeTheme") || "dark";
    if (currentTheme === "light") {
        document.body.classList.add("light-mode");
        if (themeToggleBtn) themeToggleBtn.innerHTML = "☾"; 
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", function() {
            document.body.classList.toggle("light-mode");
            if (document.body.classList.contains("light-mode")) {
                localStorage.setItem("animeTheme", "light");
                this.innerHTML = "☾"; 
            } else {
                localStorage.setItem("animeTheme", "dark");
                this.innerHTML = "☼"; 
            }
        });
    }

    // 2. EVENT DELEGATION
    document.body.addEventListener("click", function(e) {
        // Handle "WHERE TO GO" interactive cards
        var destBtn = e.target.closest(".dest-btn");
        if (destBtn) {
            document.querySelectorAll(".dest-btn").forEach(function(b) { 
                b.classList.remove("active"); 
            });
            destBtn.classList.add("active");
            if (calcType) calcType.value = destBtn.getAttribute("data-type");
            
            if (calcDest) {
                setTimeout(function() {
                    calcDest.focus();
                }, 50);
            }
        }

        // Handle "TRANSIT MULTI-SELECT" pills
        var transitBtn = e.target.closest(".t-mode-btn");
        if (transitBtn) {
            transitBtn.classList.toggle("active");
        }
    });

    // 3. LIVE CALCULATOR
    function calculateTotal() {
        var tCost = parseFloat(document.getElementById("calc-transit-cost").value) || 0;
        var hCost = parseFloat(document.getElementById("calc-hotel-cost").value) || 0;
        var nights = parseFloat(document.getElementById("calc-nights").value) || 0;
        var dCost = parseFloat(document.getElementById("calc-daily-cost").value) || 0;
        var days = parseFloat(document.getElementById("calc-days").value) || 0;

        var total = tCost + (hCost * nights) + (dCost * days);
        
        if (liveTotalEl) {
            liveTotalEl.textContent = total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }

    document.body.addEventListener("input", function(e) {
        if (e.target.classList.contains("cost-input")) {
            calculateTotal();
        }
    });

    // 4. FORM SUBMISSION
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            var typeVal = calcType.value;
            if (!typeVal) {
                alert("Please select a DESTINATION TYPE from the animated cards above first.");
                return;
            }

            var selectedTransits = [];
            document.querySelectorAll(".t-mode-btn.active").forEach(function(btn) {
                selectedTransits.push(btn.getAttribute("data-val"));
            });
            var transitString = selectedTransits.length > 0 ? selectedTransits.join(" + ") : "NOT SPECIFIED";

            var tCost = parseFloat(document.getElementById("calc-transit-cost").value) || 0;
            var hCost = parseFloat(document.getElementById("calc-hotel-cost").value) || 0;
            var nights = parseFloat(document.getElementById("calc-nights").value) || 0;
            var dCost = parseFloat(document.getElementById("calc-daily-cost").value) || 0;
            var days = parseFloat(document.getElementById("calc-days").value) || 0;
            var finalTotal = tCost + (hCost * nights) + (dCost * days);

            var newTrip = {
                id: Date.now(),
                destination: calcDest.value.trim().toUpperCase(),
                type: typeVal,
                transitModes: transitString,
                transitCost: tCost,
                stayCost: (hCost * nights),
                livingCost: (dCost * days),
                totalCost: finalTotal
            };

            tripsData.unshift(newTrip);
            try { localStorage.setItem("animeTravelLedger", JSON.stringify(tripsData)); } catch(err) {}
            
            renderSavedTrips();

            form.reset();
            calcType.value = typeVal; 
            document.querySelectorAll(".t-mode-btn").forEach(function(b) { b.classList.remove("active"); });
            calculateTotal();
        });
    }

    // 5. CLEAR BUTTON
    var btnClear = document.getElementById("btn-clear");
    if (btnClear) {
        btnClear.addEventListener("click", function() {
            if (form) form.reset();
            document.querySelectorAll(".dest-btn").forEach(function(b) { b.classList.remove("active"); });
            document.querySelectorAll(".t-mode-btn").forEach(function(b) { b.classList.remove("active"); });
            calculateTotal();
        });
    }

    // 6. RENDER TRIPS TO SCREEN
    function renderSavedTrips() {
        if (!tripsListEl) return;
        tripsListEl.innerHTML = "";

        if (tripsData.length === 0) {
            tripsListEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 30px; border: 3px dashed var(--border-color); border-radius: 8px; background: var(--bg-panel); font-weight:800;">No itineraries saved yet. Start planning!</div>';
            return;
        }

        tripsData.forEach(function(trip) {
            var card = document.createElement("div");
            card.className = "trip-card";
            
            var tFmt = trip.transitCost.toLocaleString("en-US", { minimumFractionDigits: 2 });
            var sFmt = trip.stayCost.toLocaleString("en-US", { minimumFractionDigits: 2 });
            var lFmt = trip.livingCost.toLocaleString("en-US", { minimumFractionDigits: 2 });
            var totFmt = trip.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            card.innerHTML = 
                '<div class="trip-header">' +
                    '<span class="trip-dest">' + trip.destination + '</span>' +
                    '<span class="trip-type-tag">[' + trip.type + ']</span>' +
                '</div>' +
                '<div class="trip-breakdown">' +
                    '<div class="breakdown-row">' +
                        '<span>TRANSIT</span>' +
                        '<span class="transit-modes-text">' + trip.transitModes + ' <br> <strong style="color:var(--text-main);">' + tFmt + '</strong></span>' +
                    '</div>' +
                    '<div class="breakdown-row">' +
                        '<span>ACCOMMODATION</span>' +
                        '<span style="color:var(--text-main);">' + sFmt + '</span>' +
                    '</div>' +
                    '<div class="breakdown-row">' +
                        '<span>FOOD & ACTIVITIES</span>' +
                        '<span style="color:var(--text-main);">' + lFmt + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="trip-total-row">' +
                    '<span style="font-size:0.85rem; font-weight:900; color:var(--text-muted);">CALCULATED TOTAL</span>' +
                    '<span class="trip-total-val moving-gradient-text" style="font-size:1.8rem; margin-top:0;">' + totFmt + '</span>' +
                '</div>' +
                '<button type="button" class="del-btn" data-id="' + trip.id + '">DELETE RECORD</button>';

            card.querySelector(".del-btn").addEventListener("click", function() {
                tripsData = tripsData.filter(function(t) { return t.id !== trip.id; });
                try { localStorage.setItem("animeTravelLedger", JSON.stringify(tripsData)); } catch(err) {}
                renderSavedTrips();
            });

            tripsListEl.appendChild(card);
        });
    }

    renderSavedTrips();
};

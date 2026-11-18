// --- STATE MANAGEMENT ---
var tripsData = [];
try {
    var saved = localStorage.getItem("premiumTravelLedger");
    if (saved) {
        tripsData = JSON.parse(saved);
    }
} catch(e) {}

// --- DOM ELEMENTS ---
var calcDest = document.getElementById("calc-dest");
var calcType = document.getElementById("calc-type");
var form = document.getElementById("calculator-form");
var tripsListEl = document.getElementById("saved-trips-list");
var liveTotalEl = document.getElementById("live-total");
var cursorGlow = document.getElementById("cursor-glow");
var themeToggleBtn = document.getElementById("theme-toggle");

// --- 1. AMBIENT CURSOR GLOW (Only on Desktop) ---
if (cursorGlow) {
    document.addEventListener("mousemove", function(e) {
        // Move the glowing orb to follow the mouse
        requestAnimationFrame(function() {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
        });
    });
}

// --- 2. THEME TOGGLE LOGIC ---
var currentTheme = localStorage.getItem("premiumTheme") || "dark";
if (currentTheme === "light") {
    document.body.classList.add("light-mode");
    if (themeToggleBtn) themeToggleBtn.innerHTML = "☾"; 
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", function() {
        document.body.classList.toggle("light-mode");
        if (document.body.classList.contains("light-mode")) {
            localStorage.setItem("premiumTheme", "light");
            this.innerHTML = "☾"; 
        } else {
            localStorage.setItem("premiumTheme", "dark");
            this.innerHTML = "☼"; 
        }
    });
}

// --- 3. EVENT DELEGATION (Bulletproof clicking) ---
document.body.addEventListener("click", function(e) {
    // A. Handle Destination Cards
    var destBtn = e.target.closest(".dest-btn");
    if (destBtn) {
        document.querySelectorAll(".dest-btn").forEach(function(b) { 
            b.classList.remove("active"); 
        });
        destBtn.classList.add("active");
        if (calcType) calcType.value = destBtn.getAttribute("data-type");
        if (calcDest) setTimeout(function() { calcDest.focus(); }, 50);
    }

    // B. Handle Transit Multi-Select Pills
    var transitBtn = e.target.closest(".t-mode-btn");
    if (transitBtn) {
        transitBtn.classList.toggle("active");
    }
});

// --- 4. LIVE CALCULATOR ---
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

// Catch all typing in cost inputs instantly
document.body.addEventListener("input", function(e) {
    if (e.target.classList.contains("cost-input")) {
        calculateTotal();
    }
});

// --- 5. FORM SUBMISSION ---
if (form) {
    form.addEventListener("submit", function(e) {
        e.preventDefault();

        // Safety Check
        var typeVal = calcType.value;
        if (!typeVal) {
            alert("Please select a DESTINATION TYPE from the animated cards first.");
            return;
        }

        // Collect Transits
        var selectedTransits = [];
        document.querySelectorAll(".t-mode-btn.active").forEach(function(btn) {
            selectedTransits.push(btn.getAttribute("data-val"));
        });
        var transitString = selectedTransits.length > 0 ? selectedTransits.join(" + ") : "NOT SPECIFIED";

        // Calculate Final
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
        try { localStorage.setItem("premiumTravelLedger", JSON.stringify(tripsData)); } catch(err) {}
        
        renderSavedTrips();

        // Reset
        form.reset();
        calcType.value = typeVal; 
        document.querySelectorAll(".t-mode-btn").forEach(function(b) { b.classList.remove("active"); });
        calculateTotal();
    });
}

// --- 6. CLEAR BUTTON ---
var btnClear = document.getElementById("btn-clear");
if (btnClear) {
    btnClear.addEventListener("click", function() {
        if (form) form.reset();
        document.querySelectorAll(".dest-btn").forEach(function(b) { b.classList.remove("active"); });
        document.querySelectorAll(".t-mode-btn").forEach(function(b) { b.classList.remove("active"); });
        calculateTotal();
    });
}

// --- 7. RENDER TRIPS TO SCREEN ---
function renderSavedTrips() {
    if (!tripsListEl) return;
    tripsListEl.innerHTML = "";

    if (tripsData.length === 0) {
        tripsListEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 30px; border: 1px dashed var(--glass-border); border-radius: 16px; background: var(--glass-bg);">No itineraries saved yet. Calculate an adventure to the left!</div>';
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
                    '<span class="transit-modes-text">' + trip.transitModes + ' <br> <strong>' + tFmt + '</strong></span>' +
                '</div>' +
                '<div class="breakdown-row">' +
                    '<span>ACCOMMODATION</span>' +
                    '<span>' + sFmt + '</span>' +
                '</div>' +
                '<div class="breakdown-row">' +
                    '<span>FOOD & ACTIVITIES</span>' +
                    '<span>' + lFmt + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="trip-total-row">' +
                '<span style="font-size:0.75rem; font-weight:800; color:var(--text-muted);">CALCULATED TOTAL</span>' +
                '<span class="trip-total-val">' + totFmt + '</span>' +
            '</div>' +
            '<button type="button" class="del-btn" data-id="' + trip.id + '">DELETE RECORD</button>';

        card.querySelector(".del-btn").addEventListener("click", function() {
            tripsData = tripsData.filter(function(t) { return t.id !== trip.id; });
            try { localStorage.setItem("premiumTravelLedger", JSON.stringify(tripsData)); } catch(err) {}
            renderSavedTrips();
        });

        tripsListEl.appendChild(card);
    });
}

// Initial Render
renderSavedTrips();

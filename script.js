// Global State - Loads saved trips
var tripsData = [];
try {
    var saved = localStorage.getItem("buddyTravelLedger");
    if (saved) {
        tripsData = JSON.parse(saved);
    }
} catch(e) {}

// Use window.onload to guarantee the HTML is 100% loaded before the script runs
window.onload = function() {
    var calcDest = document.getElementById("calc-dest");
    var calcType = document.getElementById("calc-type");
    var form = document.getElementById("calculator-form");
    var tripsListEl = document.getElementById("saved-trips-list");
    var liveTotalEl = document.getElementById("live-total");

    // 1. EVENT DELEGATION: Bulletproof button clicking
    document.body.addEventListener("click", function(e) {
        // Check if a destination button (or the text inside it) was clicked
        var btn = e.target.closest(".dest-btn");
        
        if (btn) {
            // Remove active class from all buttons
            document.querySelectorAll(".dest-btn").forEach(function(b) { 
                b.classList.remove("active"); 
            });
            
            // Add active class to the clicked button
            btn.classList.add("active");
            
            // Set the read-only input value to the destination type
            if (calcType) {
                calcType.value = btn.getAttribute("data-type");
            }
            
            // Auto-focus the destination name field
            if (calcDest) {
                calcDest.focus();
            }
        }
    });

    // 2. LIVE CALCULATOR
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

    // Attach input listeners using delegation to catch all typing
    document.body.addEventListener("input", function(e) {
        if (e.target.classList.contains("cost-input")) {
            calculateTotal();
        }
    });

    // 3. FORM SUBMISSION
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            // Safety Check: Ensure a category was selected
            var typeVal = calcType.value;
            if (!typeVal) {
                alert("Please select a DESTINATION TYPE (Mountains, Sea Beach, etc.) from the buttons above first.");
                return;
            }

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
                transitMode: document.getElementById("calc-transit").value,
                transitCost: tCost,
                stayCost: (hCost * nights),
                livingCost: (dCost * days),
                totalCost: finalTotal
            };

            // Add to history and save
            tripsData.unshift(newTrip);
            try { 
                localStorage.setItem("buddyTravelLedger", JSON.stringify(tripsData)); 
            } catch(err) {}
            
            renderSavedTrips();

            // Reset form but keep the category active
            form.reset();
            calcType.value = typeVal; 
            calculateTotal();
        });
    }

    // 4. CLEAR BUTTON
    var btnClear = document.getElementById("btn-clear");
    if (btnClear) {
        btnClear.addEventListener("click", function() {
            if (form) form.reset();
            document.querySelectorAll(".dest-btn").forEach(function(b) { 
                b.classList.remove("active"); 
            });
            calculateTotal();
        });
    }

    // 5. RENDER TRIPS TO SCREEN
    function renderSavedTrips() {
        if (!tripsListEl) return;
        tripsListEl.innerHTML = "";

        if (tripsData.length === 0) {
            tripsListEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px; border: 1px dashed var(--border-color);">No itineraries saved yet. Calculate a trip above!</div>';
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
                        '<span>TRANSIT (' + trip.transitMode + ')</span>' +
                        '<span>' + tFmt + '</span>' +
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
                    '<span style="font-size:0.75rem; font-weight:800;">CALCULATED TOTAL</span>' +
                    '<span class="trip-total-val">' + totFmt + '</span>' +
                '</div>' +
                '<button type="button" class="del-btn" data-id="' + trip.id + '">DELETE RECORD</button>';

            card.querySelector(".del-btn").addEventListener("click", function() {
                tripsData = tripsData.filter(function(t) { return t.id !== trip.id; });
                try { localStorage.setItem("buddyTravelLedger", JSON.stringify(tripsData)); } catch(err) {}
                renderSavedTrips();
            });

            tripsListEl.appendChild(card);
        });
    }

    // Initialize list when page loads
    renderSavedTrips();
};
      

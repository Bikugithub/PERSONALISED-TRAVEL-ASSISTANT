// State management - Load saved trips immediately
var tripsData = [];
try {
    var saved = localStorage.getItem("buddyTravelLedger");
    if (saved) {
        tripsData = JSON.parse(saved);
    }
} catch(e) {}

// DOM Elements
var destButtons = document.querySelectorAll(".dest-btn");
var calcDest = document.getElementById("calc-dest");
var calcType = document.getElementById("calc-type");
var calcTransit = document.getElementById("calc-transit");
var calcTransitCost = document.getElementById("calc-transit-cost");
var calcHotelCost = document.getElementById("calc-hotel-cost");
var calcNights = document.getElementById("calc-nights");
var calcDailyCost = document.getElementById("calc-daily-cost");
var calcDays = document.getElementById("calc-days");
var liveTotalEl = document.getElementById("live-total");
var form = document.getElementById("calculator-form");
var btnClear = document.getElementById("btn-clear");
var tripsListEl = document.getElementById("saved-trips-list");

// "Where To Go" Selector Logic
destButtons.forEach(function(btn) {
    btn.addEventListener("click", function(e) {
        // e.currentTarget ensures we click the button, even if we tap the text inside it
        var clickedBtn = e.currentTarget; 
        
        // Remove active class from all buttons
        destButtons.forEach(function(b) { b.classList.remove("active"); });
        
        // Add active class to the clicked button
        clickedBtn.classList.add("active");
        
        // Set the read-only input value in the form
        calcType.value = clickedBtn.getAttribute("data-type");
        
        // Auto-focus the destination name field so you can type immediately
        calcDest.focus();
    });
});

// Real-Time Hardcore Calculator Logic
function calculateTotal() {
    var tCost = parseFloat(calcTransitCost.value) || 0;
    var hCost = parseFloat(calcHotelCost.value) || 0;
    var nights = parseFloat(calcNights.value) || 0;
    var dCost = parseFloat(calcDailyCost.value) || 0;
    var days = parseFloat(calcDays.value) || 0;

    var total = tCost + (hCost * nights) + (dCost * days);
    
    // Format with commas and 2 decimals (e.g., 1,200.00)
    liveTotalEl.textContent = total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Attach listener to all cost inputs to update the live total instantly
var costInputs = document.querySelectorAll(".cost-input");
costInputs.forEach(function(input) {
    input.addEventListener("input", calculateTotal);
});

// Save Itinerary to History
form.addEventListener("submit", function(e) {
    e.preventDefault();

    var tCost = parseFloat(calcTransitCost.value) || 0;
    var hCost = parseFloat(calcHotelCost.value) || 0;
    var nights = parseFloat(calcNights.value) || 0;
    var dCost = parseFloat(calcDailyCost.value) || 0;
    var days = parseFloat(calcDays.value) || 0;
    var finalTotal = tCost + (hCost * nights) + (dCost * days);

    var newTrip = {
        id: Date.now(),
        destination: calcDest.value.trim().toUpperCase(),
        type: calcType.value,
        transitMode: calcTransit.value,
        transitCost: tCost,
        stayCost: (hCost * nights),
        livingCost: (dCost * days),
        totalCost: finalTotal
    };

    // Add to the top of the array
    tripsData.unshift(newTrip);
    saveData();
    renderSavedTrips();

    // Reset form but keep the category type selected
    var currentType = calcType.value;
    form.reset();
    calcType.value = currentType;
    calculateTotal(); // Resets the large display to 0.00
});

// Clear Button
btnClear.addEventListener("click", function() {
    form.reset();
    destButtons.forEach(function(b) { b.classList.remove("active"); });
    calculateTotal();
});

// Save to LocalStorage
function saveData() {
    try {
        localStorage.setItem("buddyTravelLedger", JSON.stringify(tripsData));
    } catch(e) {}
}

// Render Saved List
function renderSavedTrips() {
    tripsListEl.innerHTML = "";

    if (tripsData.length === 0) {
        tripsListEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px; border: 1px dashed var(--border-color);">No itineraries saved yet. Calculate a trip above!</div>';
        return;
    }

    tripsData.forEach(function(trip) {
        var card = document.createElement("div");
        card.className = "trip-card";
        
        // Format the numbers beautifully
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

        // Delete Button Logic
        card.querySelector(".del-btn").addEventListener("click", function() {
            tripsData = tripsData.filter(function(t) { return t.id !== trip.id; });
            saveData();
            renderSavedTrips();
        });

        tripsListEl.appendChild(card);
    });
}

// Initialize the saved list when the script first loads
renderSavedTrips();

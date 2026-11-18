// Sample Data with Authentic Context
var sampleManifest = [
    { id: 1001, type: "OUTBOUND", origin: "Howrah", destination: "Darjeeling", date: "2027-01-04", mode: "EXPRESS TRAIN", companions: "Bonolota" },
    { id: 1002, type: "RETURN", origin: "Darjeeling", destination: "Howrah", date: "2027-01-07", mode: "EXPRESS TRAIN", companions: "Bonolota" },
    { id: 1003, type: "OUTBOUND", origin: "Khamargachi", destination: "Jirat", date: "2026-10-22", mode: "REGIONAL TRAIN", companions: "Ma, Dada" }
];

// Load Storage safely
var voyageData = [];
try {
    var stored = localStorage.getItem("voyageLedgerData");
    voyageData = stored ? JSON.parse(stored) : sampleManifest;
    if (!Array.isArray(voyageData)) voyageData = sampleManifest;
} catch (e) {
    voyageData = sampleManifest;
}

var currentTheme = localStorage.getItem("voyageTheme") || "theme-midnight";
document.body.className = currentTheme;

// DOM Elements
var totalTripsEl = document.getElementById("val-total-trips");
var activeTripsEl = document.getElementById("val-active-trips");
var manifestListEl = document.getElementById("manifest-list");
var filterDirection = document.getElementById("filter-direction");
var form = document.getElementById("transit-form");

var themePanel = document.getElementById("panel-theme");

// UI Toggles
document.getElementById("btn-theme").addEventListener("click", function() {
    themePanel.classList.toggle("hidden");
});
document.getElementById("btn-close-theme").addEventListener("click", function() {
    themePanel.classList.add("hidden");
});

document.querySelectorAll(".theme-trigger").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
        var theme = e.target.getAttribute("data-theme");
        document.body.className = theme;
        try { localStorage.setItem("voyageTheme", theme); } catch (err) {}
    });
});

// Render Manifest
function renderDashboard() {
    var todayStr = new Date().toISOString().split("T")[0];
    var activeCount = 0;
    
    // Sort logs: Future dates first, then past dates descending
    voyageData.sort(function(a, b) {
        return b.date.localeCompare(a.date); 
    });

    voyageData.forEach(function(log) {
        if (log.date >= todayStr) activeCount++;
    });

    totalTripsEl.textContent = voyageData.length;
    activeTripsEl.textContent = activeCount;

    var filterVal = filterDirection.value;
    manifestListEl.innerHTML = "";

    var filtered = voyageData.filter(function(log) {
        if (filterVal === "ALL") return true;
        return log.type === filterVal;
    });

    if (filtered.length === 0) {
        manifestListEl.innerHTML = '<div style="text-align:center; color:var(--text-dim); font-size:0.8rem; padding: 20px;">No transit logs found.</div>';
        return;
    }

    filtered.forEach(function(log) {
        var div = document.createElement("div");
        div.className = "log-item";
        
        var badgeClass = log.type === "OUTBOUND" ? "badge-outbound" : "badge-return";
        var compText = log.companions ? "WITH: " + log.companions.toUpperCase() : "SOLO TRANSIT";

        div.innerHTML = 
            '<div class="log-top-row">' +
                '<span class="direction-badge ' + badgeClass + '">[' + log.type + ']</span>' +
                '<span class="log-date">DATE: ' + log.date + '</span>' +
            '</div>' +
            '<div class="route-text">' +
                log.origin.toUpperCase() + ' <span class="route-arrow">>>></span> ' + log.destination.toUpperCase() +
            '</div>' +
            '<div class="log-meta">' +
                '<div>' +
                    '<div>MODE: ' + log.mode + '</div>' +
                    '<div style="margin-top:4px;">' + compText + '</div>' +
                '</div>' +
                '<button type="button" class="del-btn" data-id="' + log.id + '">REMOVE</button>' +
            '</div>';

        div.querySelector(".del-btn").addEventListener("click", function() {
            voyageData = voyageData.filter(function(item) { return item.id !== log.id; });
            try { localStorage.setItem("voyageLedgerData", JSON.stringify(voyageData)); } catch(e){}
            renderDashboard();
        });

        manifestListEl.appendChild(div);
    });
}

// Add New Log (Future dates are allowed for travel planning!)
form.addEventListener("submit", function(e) {
    e.preventDefault();

    var newLog = {
        id: Date.now(),
        type: document.getElementById("input-direction").value,
        mode: document.getElementById("input-mode").value,
        origin: document.getElementById("input-origin").value.trim(),
        destination: document.getElementById("input-destination").value.trim(),
        date: document.getElementById("input-date").value,
        companions: document.getElementById("input-companions").value.trim()
    };

    voyageData.push(newLog);
    try { localStorage.setItem("voyageLedgerData", JSON.stringify(voyageData)); } catch(e){}
    
    form.reset();
    renderDashboard();
});

filterDirection.addEventListener("change", renderDashboard);

// Native Canvas Snapshot Generator (100% Offline, No CDN required)
document.getElementById("btn-export").addEventListener("click", function() {
    var canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1100;
    var ctx = canvas.getContext("2d");

    // Colors
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 900, 1100);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("VOYAGE // TRANSIT MANIFEST", 40, 60);

    var todayStr = new Date().toISOString().split("T")[0];
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("GENERATED: " + todayStr + " | BIKRAM'S LEDGER", 40, 100);

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(40, 130, 820, 120);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("TOTAL EXPEDITIONS: " + voyageData.length, 60, 190);
    
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("RECENT & UPCOMING ROUTES", 40, 310);

    var y = 350;
    voyageData.slice(0, 8).forEach(function(log) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(40, y, 820, 75);

        ctx.fillStyle = log.type === "OUTBOUND" ? "#eab308" : "#10b981";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("[" + log.type + "]", 60, y + 30);

        ctx.fillStyle = "#94a3b8";
        ctx.fillText(log.date, 60, y + 55);

        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(log.origin.toUpperCase() + " >>> " + log.destination.toUpperCase(), 200, y + 30);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "16px sans-serif";
        var comp = log.companions ? "WITH: " + log.companions.toUpperCase() : "SOLO";
        ctx.fillText(log.mode + " | " + comp, 200, y + 55);

        y += 85;
    });

    var link = document.createElement("a");
    link.download = "Voyage-Manifest-" + todayStr + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Boot
renderDashboard();

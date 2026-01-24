// Globals
"use strict";
const version = " V0.1.0";

var duprInfo;

const nameLookup = {};
const dupridLookup = {};

var ctcb;   // Custom Tooltip Call Back

const contexts = [];    // Holds meta data (partner, opponents, scores etc.) that is displayed in tooltip

var chart;
var ctx;
var playerName = "";

var duprDataArray = [];
var avePartnerDataArray = [];
var aveOpponentDataArray = [];
var reliabilityDataArray = [];


// Once all html/javascript/css has loaded initialize everything
async function handleOnLoad() {
    
    // Read query string parameters
    const params = new URLSearchParams(window.location.search);
    let league = params.get("league"); // only mens85plus for now
    
    if (!isParamValid(league)) {
        league = "men_all";
    }

    // // Use sanitized data if no password
    const leagueName = (league == "men_all") ? "Men All" : "Other"; // Change to object

    let resultsFilename = `Dupr_${league}.json`;

    const hash = params.get("hash"); // Hash of top secret password
    if (isParamValid(hash)) {
        resultsFilename = `Dupr_${league}_${hash}.json`;
    }

    // Real code will just gets back match results for selected player but for now extract it from all data
    // First read the results document (players names, before and after ratings etc.)
    let response = await fetch("data/" + resultsFilename);
    let textResults = await response.text();
    duprInfo = JSON.parse(textResults);

    duprInfo.forEach((di) => {
        if (! nameLookup[di.duprid]) {
            nameLookup[di.duprid] = di.name;
            dupridLookup[di.name] = di.duprid;
        }
    });

    // Load player drop downs
    // A message line followed by all players in alphabetically sorted order
    let selectPlayer = document.getElementById("player");

    let players = Object.values(nameLookup);
    players.sort();
    
    // First line: Prompt user to select a player
    let opt = document.createElement("option");
    opt.textContent = "-- Select a Player --";
    opt.value = "";
    opt.style.color = "#cccccc"
    selectPlayer.appendChild(opt);

    // Add all names in alphabetical order after prompt line
    players.forEach(function (player) {
        let opt = document.createElement("option");
        opt.textContent = player;
        opt.value = dupridLookup[player];
        selectPlayer.appendChild(opt);
    })

    // Create the configurations object for linear and time axes
    const titleText = document.getElementById("title").innerText + version;
    const isTitleVisible = document.getElementById("titleVisible").checked;
    const isLegendVisible = document.getElementById("legendVisible").checked;

    let ratingData = {
        datasets: [{
        backgroundColor: "#ffffff",
        pointRadius: 5,
        pointHoverRadius: 7,
        label: "DUPR",
        borderColor: "#cc3300",
        pointBackgroundColor: "#cc3300",
        backgroundColor: "#cc3300",
        data: null
        },
        {
        backgroundColor: "white",
        pointRadius: 5,
        pointHoverRadius: 7,
        label: "Ave Partner",
        borderColor: "#0000cc",
        pointBackgroundColor: "#0000cc",
        backgroundColor: "#0000cc",
        data: null
        },
        {
        backgroundColor: "white",
        pointRadius: 5,
        pointHoverRadius: 7,
        label: "Ave Opponent",
        borderColor: "#00cc00",
        pointBackgroundColor: "#00cc00",
        backgroundColor: "#00cc00",
        data: null
        },
        {
            // stepped: true,
        yAxisID: "reliability",
        backgroundColor: "white",
        pointRadius: 5,
        pointHoverRadius: 7,
        label: "Reliability",
        borderColor: "#111111",
        pointBackgroundColor: "#111111",
        backgroundColor: "#111111",
        data: null
        }]
    };


    let config = {
        type: "scatter",
        data: ratingData,
        options: {
            plugins: {
                legend:{display: isLegendVisible, labels: {boxWidth: 12}},
                title: {display: isTitleVisible, text: titleText} //,
                //tooltip: { enabled: false, external: ctcb}
            },
            showLine: true,
            stepped: document.getElementById("stepped").checked,
            animation: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    // type: "linear",
                    // title: {display: true, text: "Game #"}
                    id: "x",
                    time: {unit: "day", displayFormats: {day: "yyyy-MM-dd"}},
                    type: 'time',
                    title: {display: true,text: 'Date'}
                },
                
                y: {
                    type: "linear",
                    position: "left",
                    title: {display: true, text: "Rating"}
                },

                reliability: {
                    type: "linear",
                    position: "right",
                    title: { display: true, text: "Reliability"},
                    grid: {display: false}
                }
            }
        }
    };

    // Create a linear or sequential x-axis chart chart
    ctx = document.getElementById("chartCanvas").getContext("2d");
    chart = new Chart(ctx, config);
}

// Different player selected
function handlePlayerChange() {

    let duprid = document.getElementById("player").value;

    if (! duprid) {
        chart.data.datasets[0].data = null;
        
        chart.update();
        return;
    }

    playerName = nameLookup[duprid];
    
    let x = 0;
    // let yDUPR;

    duprDataArray = [];
    avePartnerDataArray = [];
    aveOpponentDataArray = [];
    reliabilityDataArray = [];

    duprInfo.forEach((di) => {
        if ( di.duprid == duprid) {
            duprDataArray.push({x: di.snapshot_ts, y: di.doubles});
            // avePartnerDataArray.push({x: x, y: di.avePartner});
            // aveOpponentDataArray.push({x: x, y: di.aveOpponent});
            avePartnerDataArray.push({x: di.snapshot_ts, y: di.doubles + 0.5});
            aveOpponentDataArray.push({x: di.snapshot_ts, y: di.doubles + 1.0});
            reliabilityDataArray.push({x: di.snapshot_ts, y: 55.0 + x++});
        }
    });

    chart.data.datasets[0].data = duprDataArray;
    chart.data.datasets[1].data = avePartnerDataArray;
    chart.data.datasets[2].data = aveOpponentDataArray;
    chart.data.datasets[3].data = reliabilityDataArray;
 
    chart.update();
}

// Toggle between stepped and direct line connections between points
function handleSteppedClick() {
    let isStepped = document.getElementById("stepped").checked;

    chart.data.datasets[0].stepped = isStepped;
    chart.data.datasets[1].stepped = isStepped;
    chart.data.datasets[2].stepped = isStepped;
    chart.data.datasets[3].stepped = isStepped;

    chart.update();
}

// Hide/show chart legend
function handleLegendVisibleClick() {
    let isLegendVisible = document.getElementById("legendVisible").checked;

    chart.options.plugins["legend"] = {display: isLegendVisible, labels: { boxWidth: 12 } };

    chart.update();
}

// Hide/show chart title
function handleTitleVisibleClick() {
    let isTitleVisible = document.getElementById("titleVisible").checked;

    chart.options.plugins["title"].display = isTitleVisible;

    chart.update();
}

// Check that a query string parameter is valid (not null, undefined or empty)
function isParamValid(param) {
    return param !== null && param !== undefined && param !== "";
}

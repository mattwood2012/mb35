// Globals
"use strict";
const version = " V0.2.0";

var gameResults;

const nameLookup = {};
const uidLookup = {};

var ctcb;   // Custom Tooltip Call Back

const contexts = [];    // Holds meta data (partner, opponents, scores etc.) that is displayed in tooltip

var chart;
var ctx;
var playerName = "";

var viprDataArray = [];
var duprDataArray = [];

// var ratingData;

// Once all html/javascript/css has loaded initialize everything
async function handleOnLoad() {
    
    // Read query string parameters
    const params = new URLSearchParams(window.location.search);
    let league = params.get('league'); // only mens85plus for now
    
    if (!isParamValid(league)) {
        league = "mens85plus";
    }

    // // Use sanitized data if no password
    const leagueName = (league == "mens85plus") ? "Mens 8.5+ PYP" : "Men's League"; // Change to object
    let resultsFilename = `${league}_sanitized_recalculated.json`;

    const hash = params.get('hash'); // Hash of top secret password
    if (isParamValid(hash)) {
        resultsFilename = `${league}_${hash}.json`;
    }

    // Real code will just gets back match results for selected player but for now extract it from all data
    // First read the results document (players names, before and after ratings etc.)
    //let response = await fetch("data/VAR_mens.json"); // + resultsFilename);
    //resultsFilename = "VAR_mens.json";
        // let response2 = await fetch("data/" + "VAR_mens.json");
        resultsFilename = "mens85plus_sanitized_recalculated.json";
        let response2 = await fetch("data/" + resultsFilename);
    let path = "data/" + resultsFilename;
    let response = await fetch("data/" + resultsFilename);
    let response3 = await fetch("data/mens85plus_sanitized_recalculated.json");
    let textResults = await response.text();
    gameResults = JSON.parse(textResults);

    gameResults.forEach((gr) => {
        if (! nameLookup[gr.visitor1_uid]) {
          nameLookup[gr.visitor1_uid] = gr.visitor1_name;
          uidLookup[gr.visitor1_name] = gr.visitor1_uid;
        }
        if (! nameLookup[gr.visitor2_uid]) {
          nameLookup[gr.visitor2_uid] = gr.visitor2_name;
          uidLookup[gr.visitor2_name] = gr.visitor2_uid;
        }
        if (! nameLookup[gr.home1_uid]) {
          nameLookup[gr.home1_uid] = gr.home1_name;
          uidLookup[gr.home1_name] = gr.home1_uid;
        }
        if (! nameLookup[gr.home2_uid]) {
          nameLookup[gr.home2_uid] = gr.home2_name;
          uidLookup[gr.home2_name] = gr.home2_uid;
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
        opt.value = uidLookup[player];
        selectPlayer.appendChild(opt);
    })

    // Custom tooltip callback function
    ctcb = function (tooltipContext) {
        const tooltipModel = tooltipContext.tooltip;

        // Get tooltip Element
        var tooltipEl = document.getElementById('tooltip');

        // Hide if no tooltip
        if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        // Set caret Position
        tooltipEl.classList.remove('above', 'below', 'no-transform');
        if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
            tooltipEl.classList.add('no-transform');
        }

        // Lookup context for this game
        //let xIndex = chart.active[0]._index;
        let xIndex = tooltipContext.chart._active[0].index;
        let context = contexts[xIndex];

        const isVIPR = tooltipModel.dataPoints[0].datasetIndex == 0;

        if (xIndex == 0) {
            let toolTipUID = document.getElementById("player").value;
            tooltipEl.innerHTML = `
            <div style="width: auto">
                <div style="width: auto">Initial VIPR: ${GetInitialVIPR(context, toolTipUID)}</div>
                <div style="width: auto">Initial DUPR: ${GetInitialDUPR(context, toolTipUID)}</div>
            </div>`;
        } else {
            // Build the html the tooltip will hold
            let innerHTML = `
            <div class="full_row">Date: ${context.match_date}, Match: ${context.match_id.substr(context.match_id.length-4)}, Game: ${context.game_number}, ${isVIPR ? "(VIPR)":"(DUPR)"}</div>
            
            <div class="player-header">Players</div>
            <div class="centered-header">Before</div>
            <div class="centered-header">Team &Delta;</div>
            <div class="score-header">Score</div>
            <div class="centered-header">After</div>

            <div class="name-holder player-holder">${context.visitor1_name}:</div>
            <div class="data-holder">${(isVIPR ? context.visitor1_rating_before : context.visitor1_DUPR_before).toFixed(3)}</div>
            <div class="changeR-visitor">${(isVIPR ? GetVisitorTeamDeltaRating(context) : GetVisitorTeamDeltaDUPR(context)).toFixed(3)}</div>
            <div class="score-visitor">${(context.visitor_points)}</div>
            <div class="data-holder">${(isVIPR ? context.visitor1_rating_after : context.visitor1_DUPR_after).toFixed(3)}</div>

            <div class="name-holder player-holder">${context.visitor2_name}:</div>
            <div class="data-holder">${(isVIPR ? context.visitor2_rating_before : context.visitor2_DUPR_before).toFixed(3)}</div>
            <div class="data-holder">${(isVIPR ? context.visitor2_rating_after : context.visitor2_DUPR_after).toFixed(3)}</div>

            <div class="name-holder player-holder">${context.home1_name}:</div>
            <div class="data-holder">${(isVIPR ? context.home1_rating_before : context.home1_DUPR_before).toFixed(3)}</div>
            <div class="changeR-home">${(isVIPR ? -GetVisitorTeamDeltaRating(context) : -GetVisitorTeamDeltaDUPR(context)).toFixed(3)}</div>
            <div class="score-home">${context.home_points}</div>
            <div class="data-holder">${(isVIPR ? context.home1_rating_after : context.home1_DUPR_after).toFixed(3)}</div>

            <div class="name-holder player-holder">${context.home2_name}:</div>
            <div class="data-holder">${(isVIPR ? context.home2_rating_before : context.home2_DUPR_before).toFixed(3)}</div>
            <div class="data-holder">${(isVIPR ? context.home2_rating_after : context.home2_DUPR_after).toFixed(3)}</div>`
            //<div class="full_row">crf: ${context.meta.crf}, scale: ${context.meta.scale}, curve: ${context.meta.curve}, algo_type: ${context.meta.algo_type}</div>`;

            // Load tooltip with html formatted information about the point clicked/hovered over
            tooltipEl.innerHTML = innerHTML;
        }

        // Set location and styles of tooltip
        var position = chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = 1;
        tooltipEl.style.position = 'absolute';
        const root = document.documentElement;

        let left = position.left + window.pageXOffset + tooltipModel.caretX;
        // If tooltip is on right half of screen, shift it to left side of caret
        if (tooltipModel.caretX > position.width / 2) {
            //const root = document.documentElement;
            left -= 380;
        }
        
        let top = position.top + window.pageYOffset + tooltipModel.caretY;
        // If tooltip is on bottom half of screen, shift it to top side of caret
        if (tooltipModel.caretY > position.height / 2) {
            top -= 158;
        }


        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = top + "px";

        tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
        tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
        tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
        tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
        tooltipEl.style.pointerEvents = 'none';
    }

    // Create the configurations object for linear and time axes
    const titleText = document.getElementById("title").innerText + version;
    const isTitleVisible = document.getElementById("titleVisible").checked;
    const isLegendVisible = document.getElementById("legendVisible").checked;

    // if (playerName == "") {
    //     let innerHTML = `<div class="page">
    //     <div class="title">The selected player has not played a game in ${leagueName}</div>`
    //     document.getElementById("body").innerHTML = innerHTML;
    //     return;
    // }
    
    let ratingData = {
        datasets: [{
        backgroundColor: "#ffffff",
        pointRadius: 5,
        pointHoverRadius: 7,
        label: `VIPR`,
        borderColor: "#00cc00",
        pointBackgroundColor: "#00cc00",
        backgroundColor: "#00cc00",
        data: null
        },
        {
        backgroundColor: "white",
        pointRadius: 5,
        pointHoverRadius: 7,
        label: `DUPR`,
        borderColor: "#cc3300",
        pointBackgroundColor: "#cc3300",
        backgroundColor: "#cc3300",
        data: null
        }]
    };

    let config = {
        type: 'scatter',
        data: ratingData,
        options: {
            plugins: {
                legend:{display: isLegendVisible, labels: {boxWidth: 12}},
                title: {display: isTitleVisible, text: titleText},
                tooltip: { enabled: false, external: ctcb}
            },
            showLine: true,
            stepped: document.getElementById("stepped").checked,
            animation: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    id: "x",
                    type: "linear",
                    title: {display: true, text: "Game #"}
                },
                y: {
                    // min: 4.0,
                    // max: 5.0,
                    title: {
                        display: true,
                        text: 'Rating'
                    }
                }
            }
        }
    };

    // Create a linear or sequential x-axis chart chart
    ctx = document.getElementById('chartCanvas').getContext('2d');
    chart = new Chart(ctx, config);
}

// Different player selected
function handlePlayerChange() {

    let player_uid = document.getElementById('player').value;

    if (! player_uid) {
        chart.data.datasets[0].label = "VIPR";
        chart.data.datasets[1].label = "DUPR";
        chart.data.datasets[0].data = null;
        chart.data.datasets[1].data = null;
        
        chart.update();
        return;
    }

    playerName = nameLookup[player_uid];
    
    let x = 0;
    let yVIPR
    let yDUPR;
    let initialVIPR;
    let initialDUPR;


    viprDataArray = [];
    duprDataArray = [];
    contexts.length = 0;

    gameResults.forEach((gr) => {

        let playerInGame = gr.visitor1_uid == player_uid ||
                            gr.visitor2_uid == player_uid ||
                            gr.home1_uid == player_uid ||
                            gr.home2_uid == player_uid;
                            
        if ( playerInGame) {
            if (x == 0) {
                initialVIPR = GetInitialVIPR(gr, player_uid);
                viprDataArray.push({x: x, y: initialVIPR});
                initialDUPR = GetInitialDUPR(gr, player_uid);
                duprDataArray.push({x: x++, y: initialDUPR});
                contexts.push(gr);
            }

            yVIPR = GetVIPRy(gr, player_uid);
            viprDataArray.push({x: x, y: yVIPR});
            
            yDUPR = GetDUPRy(gr, player_uid);
            duprDataArray.push({x: x++, y: yDUPR});

            contexts.push(gr);
        }
    });

    chart.data.datasets[0].label = playerName + " VIPR";
    chart.data.datasets[0].data = viprDataArray;
    chart.data.datasets[1].label = playerName + " DUPR";
    chart.data.datasets[1].data = duprDataArray; 

    chart.update();

}

// Toggle between stepped and direct line connections between points
function handleSteppedClick() {
    let isStepped = document.getElementById("stepped").checked;

    chart.data.datasets[0].stepped = isStepped;
    chart.data.datasets[1].stepped = isStepped;

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

// Toggle Y-axis auto/manual range
function handleAutoYClick() {
    let inAutoY = document.getElementById("autoY").checked;
    let minY = document.getElementById("yMin").value;
    let maxY = document.getElementById("yMax").value;


        // if (inAutoY) {
            chart.options.scales.y.min = inAutoY ? null : Number(minY);
            chart.options.scales.y.max = inAutoY ? null : Number(maxY);

            document.getElementById("yMin").style.display = inAutoY ? "none" : "inline";
            document.getElementById("yMax").style.display = inAutoY ? "none" : "inline";
            document.getElementById("yMinLabel").style.display = inAutoY ? "none" : "inline";
            document.getElementById("yMaxLabel").style.display = inAutoY ? "none" : "inline";

        // } else {
        //     chart.options.scales.y.min = minY;
        //     chart.options.scales.y.max = maxY;
        // }
    chart.update();
}

function handleAxisInput(event) {
    if (! document.getElementById("autoY").checked) {
        chart.options.scales.y.min = document.getElementById("yMin").value;
        chart.options.scales.y.max = document.getElementById("yMax").value;
        
        chart.update();
    }
}

// Return VIPR rating after the match for the specified player in the specified algo result object
// Also sets global playerName variable - naughty!
function GetVIPRy(ar, player_uid) {

    if (ar.visitor1_uid == player_uid) {
        if (playerName =="") playerName = ar.visitor1_name;
        return ar.visitor1_rating_after;
    } else if (ar.visitor2_uid == player_uid) {
        if (playerName =="") playerName = ar.visitor2_name;
        return ar.visitor2_rating_after;
    } else if (ar.home1_uid == player_uid) {
        if (playerName =="") playerName = ar.home1_name;
        return ar.home1_rating_after;
    } else if (ar.home2_uid == player_uid) {
        if (playerName =="") playerName = ar.home2_name;
        return ar.home2_rating_after;
    } else {
        return null;
    }
}

// Return VIPR rating after the match for the specified player in the specified algo result object
// Also sets global playerName variable - naughty!
function GetDUPRy(ar, player_uid) {

    if (ar.visitor1_uid == player_uid) {
        if (playerName =="") playerName = ar.visitor1_name;
        return ar.visitor1_DUPR_after;
    } else if (ar.visitor2_uid == player_uid) {
        if (playerName =="") playerName = ar.visitor2_name;
        return ar.visitor2_DUPR_after;
    } else if (ar.home1_uid == player_uid) {
        if (playerName =="") playerName = ar.home1_name;
        return ar.home1_DUPR_after;
    } else if (ar.home2_uid == player_uid) {
        if (playerName =="") playerName = ar.home2_name;
        return ar.home2_DUPR_after;
    } else {
        return null;
    }
}

// Return VIPR rating before the match for the specified player in the specified algo result object
// Also sets global playerName variable - naughty!
function GetInitialVIPR(ar, player_uid) {

    if (ar.visitor1_uid == player_uid) {
        if (playerName =="") playerName = ar.visitor1_name;
        return ar.visitor1_rating_before;
    } else if (ar.visitor2_uid == player_uid) {
        if (playerName =="") playerName = ar.visitor2_name;
        return ar.visitor2_rating_before;
    } else if (ar.home1_uid == player_uid) {
        if (playerName =="") playerName = ar.home1_name;
        return ar.home1_rating_before;
    } else if (ar.home2_uid == player_uid) {
        if (playerName =="") playerName = ar.home2_name;
        return ar.home2_rating_before;
    } else {
        return null;
    }
}

// Return VIPR rating before the match for the specified player in the specified algo result object
// Also sets global playerName variable - naughty!
function GetInitialDUPR(ar, player_uid) {

    if (ar.visitor1_uid == player_uid) {
        if (playerName =="") playerName = ar.visitor1_name;
        return ar.visitor1_DUPR_before;
    } else if (ar.visitor2_uid == player_uid) {
        if (playerName =="") playerName = ar.visitor2_name;
        return ar.visitor2_DUPR_before;
    } else if (ar.home1_uid == player_uid) {
        if (playerName =="") playerName = ar.home1_name;
        return ar.home1_DUPR_before;
    } else if (ar.home2_uid == player_uid) {
        if (playerName =="") playerName = ar.home2_name;
        return ar.home2_DUPR_before;
    } else {
        return null;
    }
}

// Calculates the combined VIPR difference in VIPR rating for a team based on individual player VIPR ratings and a CRF (used in creating tooltip)
function GetVisitorTeamDeltaRating(context) {
    {
        let visitorCombinedRating = GetCombinedRating(context.visitor1_rating_before, context.visitor2_rating_before, context.meta.crf);
        let homeCombinedRating = GetCombinedRating(context.home1_rating_before, context.home2_rating_before, context.meta.crf);
        
        return visitorCombinedRating - homeCombinedRating;
    }
}

// Calculates the combined VIPR difference in VIPR rating for a team based on individual player VIPR ratings and a CRF (used in creating tooltip)
function GetVisitorTeamDeltaDUPR(context) {
    {
        let visitorCombinedDUPR = GetCombinedRating(context.visitor1_DUPR_before, context.visitor2_DUPR_before, context.meta.crf);
        let homeCombinedDUPR = GetCombinedRating(context.home1_DUPR_before, context.home2_DUPR_before, context.meta.crf);
        
        return visitorCombinedDUPR - homeCombinedDUPR;
    }
}

// Calculates the combined VIPR rating for a team based on individual player VIPR ratings and a CRF (used by GetVisitorTeamDeltaRating)
function GetCombinedRating(player1VIPR, player2VIPR, crf) {
    {
        const average = (player1VIPR + player2VIPR) / 2.0;
        return average - (average - Math.min(player1VIPR, player2VIPR)) * crf;
    }
}

// Check that a query string parameter is valid (not null, undefined or empty)
function isParamValid(param) {
    return param !== null && param !== undefined && param !== "";
}


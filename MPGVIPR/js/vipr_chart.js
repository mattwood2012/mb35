// Globals
"use strict";
const version = " V0.1";
var player_uid; //"49d40ef4a000349ccbc15c5e"; //"c459812410f5cd9bda326c26";

var algoResults;
var ctcb;   // Custom Tooltip Call Back

const contexts = [];    // Holds meta data (partner, opponents, scores etc.) that is displayed in tooltip

var chart;
var ctx
var playerName;

var timeDataArray = [];
var linearDataArray = [];

var timeConfig;
var linearConfig;

var timeData;
var linearData;

// Once all html/javascript/css has loaded initialize everything
async function handleOnLoad() {
    
    // Read query string parameters
    let league;
    let hash
    const params = new URLSearchParams(window.location.search);
    league = params.get('league'); // mens or pyp
    if (league == null) league = "mens";

    player_uid = (league == "mens") ? "49d40ef4a000349ccbc15c5e" : "c459812410f5cd9bda326c26";
    
    hash = params.get('hash'); // Hash of top secret password

    let resultsFilename;
    if (hash == "null" || hash == null || hash == "" || hash == "undefined") {
        resultsFilename = `ViprAlgoResults_${league}_sanitized.json`;
    } else {
        resultsFilename = `${hash}_${league}.json`;
    }

    // Real code will just gets back match results for selected player but for now extract it from all data
    // First read the results document (players names, before and after ratings etc.)
    try {
        let response = await fetch("data/" + resultsFilename);
        let textResults = await response.text();
        algoResults = JSON.parse(textResults);
    } catch (err) {
        alert("Incorrect password. Click OK to close this dialog and then go back to the main page to try again. If you don't know the password leave it blank to load a generic version of the data");
        return;
    }

    // Create an array of results and time/sequential plot data for the games player played in 
    let x = 1;
    let y;

    algoResults.forEach((ar) => {

        let playerInGame = ar.visitor1_uid == player_uid ||
                            ar.visitor2_uid == player_uid ||
                            ar.home1_uid == player_uid ||
                            ar.home2_uid == player_uid;
                            
        if ( playerInGame) {
            
            y = GetY(ar, player_uid);
            
            timeDataArray.push({x : ar.match_date, y: y});
            linearDataArray.push({x: x++, y: y});
            
             contexts.push(ar);
        }
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

        // Build the html the tooltip will hold
        let innerHTML = `
        <div class="full_row">Date: ${context.match_date}, Match: ${context.match_id.substr(context.match_id.length-4)}, Game: ${context.game_number}</div>
        
        <div></div>
        <div class="name_holder">Players</div>
        <div class="data_holder">Before</div>
        <div class="data_holder">After</div>
        <div class="data_holder">Delta</div>
        <div class="data_holder">Score</div>

        <div class="name_holder">Visitor&nbsp;1:</div>
        <div class="name_holder">${context.visitor1_name}</div>
        <div class="data_holder">${context.visitor1_rating_before.toFixed(3)}</div>
        <div class="data_holder">${context.visitor1_rating_after.toFixed(3)}</div>
        <div class="data_holder">${(context.visitor1_rating_after - context.visitor1_rating_before).toFixed(3)}</div>
        <div></div>

        <div class="name_holder">Visitor&nbsp;2:</div>
        <div class="name_holder">${context.visitor2_name}</div>
        <div class="data_holder">${context.visitor2_rating_before.toFixed(3)}</div>
        <div class="data_holder">${context.visitor2_rating_after.toFixed(3)}</div>
        <div class="data_holder">${(context.visitor2_rating_after - context.visitor2_rating_before).toFixed(3)}</div>
        <div class="score_holder">${(context.visitor_points)}</div>

        <div class="name_holder">Home&nbsp;1:</div>
        <div class="name_holder">${context.home1_name}</div>
        <div class="data_holder">${context.home1_rating_before.toFixed(3)}</div>
        <div class="data_holder">${context.home1_rating_after.toFixed(3)}</div>
        <div class="data_holder">${(context.home1_rating_after - context.home1_rating_before).toFixed(3)}</div>
        <div></div>

        <div class="name_holder">Home&nbsp;2:</div>
        <div class="name_holder">${context.home2_name}</div>
        <div class="data_holder">${context.home2_rating_before.toFixed(3)}</div>
        <div class="data_holder">${context.home2_rating_after.toFixed(3)}</div>
        <div class="data_holder">${(context.home2_rating_after - context.home2_rating_before).toFixed(3)}</div>
        <div class="score_holder">${context.home_points}</div>

        <div class="full_row">crf: ${context.meta.crf}, scale: ${context.meta.scale}, curve: ${context.meta.curve}, algo_type: ${context.meta.algo_type}</div>`;

        // Load tooltip with html formatted information about the point clicked/hovered over
        tooltipEl.innerHTML = innerHTML;

        // Set location and styles of tooltip
        var position = chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = 1;
        tooltipEl.style.position = 'absolute';

        let left = position.left + window.pageXOffset + tooltipModel.caretX;
        if (left > window.screen.width / 2) {
            left -= 400;    // 400 comes from CSS (tooltip) container class width
        }

        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
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
    
    timeData = {
        datasets: [{
        label: playerName,
        borderColor: "rgb(247,136,47)",
        pointBackgroundColor: "rgb(247,136,47)",
        backgroundColor: "rgb(247,136,47)",
        data: timeDataArray
        }]
    };
    
    linearData = {
        datasets: [{
        label: playerName,
        borderColor: "rgb(247,136,47)",
        pointBackgroundColor: "rgb(247,136,47)",
        backgroundColor: "rgb(247,136,47)",
        data: linearDataArray
        }]
    };

    timeConfig = {
        type: 'scatter',
        data: timeData,
        options: {
            plugins: {
                legend:{display: isLegendVisible, labels: {boxWidth: 12}},
                title: {display: isTitleVisible, text: titleText},
                tooltip: { enabled: false, external: ctcb}
            },
            showLine: true,
            stepped: true,
            animation: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    id: "x",
                    time: {unit: "week", displayFormats: {day: "yyyy-MM-dd"}},
                    type: 'time',
                    title: {display: true,text: 'Date'}
                },
                y: {
                    id: "y",
                    title: {display: true,text: 'VIPR Rating'}
                }
            }
        }
    };

    linearConfig = {
        type: 'scatter',
        data: linearData,
        options: {
            plugins: {
                legend:{display: isLegendVisible, labels: {boxWidth: 12}},
                title: {display: isTitleVisible, text: titleText},
                tooltip: { enabled: false, external: ctcb}
            },
            showLine: true,
            stepped: true,
            animation: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    id: "x",
                    type: "linear",
                    title: {display: true, text: "Game #"}
                },
                y: {
                    title: {
                        display: true,
                        text: 'VIPR Rating'
                    }
                }
            }
        }
    };

    // Create a linear or sequential x-axis chart chart
    ctx = document.getElementById('chartCanvas').getContext('2d');
    const isDateXaxis = document.getElementById("datex").checked;

    if (isDateXaxis) {
        chart = new Chart(ctx, timeConfig);
    } else {
        chart = new Chart(ctx, linearConfig);
    }
}

// Toggle between linear Game # and Date on x-axis
function handleDatexAxisClick() {

    if (chart) {
        chart.destroy();
    }

    // Create a linear or sequential x-axis chart chart
    if (document.getElementById("datex").checked) {
        chart = new Chart(ctx, timeConfig);
    } else {
        chart = new Chart(ctx, linearConfig);
    }

    //chart.update();
    handleSteppedClick();
    handleLegendVisibleClick();
    handleTitleVisibleClick();

}

// Toggle between stepped and direct line connections between points
function handleSteppedClick() {
    let isStepped = document.getElementById("stepped").checked;

    chart.data.datasets[0].stepped = isStepped;

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

// Return VIPR rating after the match for the specified player in the specified algo result object
// Also sets global playerName variable - naughty!
function GetY(ar, player_uid) {

    if (ar.visitor1_uid == player_uid) {
        playerName = ar.visitor1_name;
        return ar.visitor1_rating_after;
    } else if (ar.visitor2_uid == player_uid) {
        playerName = ar.visitor2_name;
        return ar.visitor2_rating_after;
    } else if (ar.home1_uid == player_uid) {
        playerName = ar.home1_name;
        return ar.home1_rating_after;
    } else if (ar.home2_uid == player_uid) {
        playerName = ar.home2_name;
        return ar.home2_rating_after;
    } else {
        return null;
    }
}

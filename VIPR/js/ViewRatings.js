// Globals
"use strict";
const version = " V0.1";
const maxPlayers = 3;
const chartTitle = document.getElementById("title").innerText;
const lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255"];

var algoResults;
var ctcb;   // Custom Tooltip Call Back

const contexts = {};    // Holds meta data (partner, opponents, scores etc.) that is displayed in tooltip
const nameLookup = {};

var chart;
const chartDatasets = [];

// Once all html/javascript/css has loaded initialize everything
async function handleOnLoad() {

    // First read the results document (players names, before and after ratings etc.)
    let resultsFilename = "ViprAlgoResults_mens.json";
    let response = await fetch("data/" + resultsFilename);
    let textResults = await response.text();
    algoResults = JSON.parse(textResults);

    // Create a lookup from player Uid to player name 
    algoResults.forEach((ar) => {

        if (! nameLookup.visitor1_uid) { nameLookup[ar.visitor1_uid] = ar.visitor1_name}
        if (! nameLookup.visitor2_uid) { nameLookup[ar.visitor2_uid] = ar.visitor2_name}
        if (! nameLookup.home1_uid) { nameLookup[ar.home1_uid] = ar.home1_name}
        if (! nameLookup.home2_uid) { nameLookup[ar.home2_uid] = ar.home2_name}
    })
    
    // Load player drop downs
    // A blank line followed by all players in alphabetically sorted order
    let players = Object.values(nameLookup);
    players.sort();

    for (var i = 0; i < maxPlayers; i++) {
        let selectPlayer = document.getElementById("player" + i);

        // Blank first line
        let opt = document.createElement("option");
        selectPlayer.appendChild(opt);

        // Add all names after blank line
        players.forEach(function (player) {
            let opt = document.createElement("option");
            opt.textContent = player;
            opt.value = player;
            selectPlayer.appendChild(opt);
        })
    }

    // Custom tooltip callback function
    ctcb = function (tooltipModel) {

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
        let dsi = chart.active[0]._datasetIndex;
        let xIndex = chart.active[0]._index;

        let playerName = chart.config.data.datasets[dsi].label;

        let context = (contexts[playerName])[xIndex];

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
        var position = this._chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = 1;
        tooltipEl.style.position = 'absolute';

        let left = position.left + window.pageXOffset + tooltipModel.caretX;
        if (left > window.screen.width / 2) {left -= 400;}
        tooltipEl.style.left = left + 'px';

        tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
        tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
        tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
        tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
        tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
        tooltipEl.style.pointerEvents = 'none';
        
    }

    // For each of the (3) possible chart lines create a "no player selected" Dataset
    // This Dataset will be replaced when a player is selected from a "playerX" dropdown and save in array
    for (let i = 0; i < maxPlayers; i++) {

        const chartDataset = {
            label: "Not Set",
            fill: false,
            showLine: true,
            steppedLine: true,
            lineTension: 0,
            pointRadius: 4,
            borderColor: lineColors[i],
            pointBackgroundColor: lineColors[i],
            data: [{ x: null, y: null }]
        }

        let newDataset = Object.create(chartDataset);
        chartDatasets.push(newDataset);
    }


    // Create the chart
    let ctx = document.getElementById('myChart').getContext('2d');
        
    chart = new Chart(ctx, {
        type: "scatter",
        data: { datasets: chartDatasets },
        options: {
            title: { display: true, text: document.getElementById("title").innerText + version },
            tooltips: { enabled: false, custom: ctcb },
            animation: { duration: 0 },
            maintainAspectRatio: false,
            legend: { display: true, labels: { boxWidth: 12 } },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "VIPR Rating",
                    }
                }],
                xAxes: [{
                    type: "time",
                    time: {
                        unit: "week",
                        displayFormats: {
                            day: "yyyy-MM-dd"
                        },
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "Game #"
                    }
                }]

            }
        }
    })

    chart.update();
}

function handlePlayerChange(playerNumber) {
    
    let playerName = document.getElementById("player" + playerNumber).value;
    let lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255"];

    let x = 1;
    let y;
    let contextArray = [];

    // Get the dataset for this playerN id and clear the data
    let cds = chart.data.datasets[playerNumber];
    cds.data.length = 0; 

    let dateXaxis = document.getElementById("datex").checked;


    if (playerName != "") {

        // Build context and data arrays
        for (let i = 0; i < Object.keys(algoResults).length; i++){
            
            y = GetY(algoResults[i], playerName);
            
            if (y) {
                if (dateXaxis) {
                    cds.data.push({x : (algoResults[i]).match_date, y: y});
                } else {
                    cds.data.push({x: x++, y: y});
                }

                contextArray.push(algoResults[i]);
            };

        }
        contexts[playerName] = contextArray;

        cds.label = playerName;
        cds.fill = false;
        cds.showLine = true;
        cds.steppedLine = document.getElementById("stepped").checked;
        cds.lineTension = 0;
        cds.pointRadius = 4;
        cds.borderColor = lineColors[playerNumber];
        cds.pointBackgroundColor = lineColors[playerNumber];

        chart.options.scales.xAxes[0].scaleLabel.labelString = dateXaxis ? "Date" : "Game #";
        chart.options.scales.xAxes[0].type = dateXaxis ? "time" : "linear";

        // 
        if (document.getElementById("datex").checked) {
            let minMax = CalculateDateMinMax();

            chart.options.scales.xAxes[0].ticks.min = minMax.min;
            chart.options.scales.xAxes[0].ticks.max = minMax.max;
        } else {
            chart.options.scales.xAxes[0].ticks.min = undefined;
            chart.options.scales.xAxes[0].ticks.max = undefined;
        }
    }
    else {

        cds.label = "Not Set";
        cds.data.push({ x: null, y: null });
        cds.borderColor = undefined;
        cds.pointBackgroundColor = undefined;
    }
    
    chart.update();
}

function handleDatexClick() {

    // Use handlePlayerChange to take care of correct date/linear data format
    for (let i=0; i<maxPlayers; i++) {
        handlePlayerChange(i)
    }

}

function handleSteppedClick() {
    let isStepped = document.getElementById("stepped").checked;

    chart.data.datasets.forEach(function (dataset) {
        dataset.steppedLine = isStepped;
    });

    chart.update();
}

function handleLegendVisibleClick() {
    let isLegendVisible = document.getElementById("legendVisible").checked;

    chart.config.options.legend.display = isLegendVisible;

    chart.update();
}

function handleTitleVisibleClick() {
    let isTitleVisible = document.getElementById("titleVisible").checked;

    chart.config.options.title.display = isTitleVisible;

    chart.update();
}

function toggleSettingsVisibility() {
    let areSettingsDisplayed = document.getElementById("settings").style.display;
    document.getElementById("chartHolder").style.height = (areSettingsDisplayed == "none") ? "80vh" : "88vh";
    document.getElementById("settings").style.display = (areSettingsDisplayed == "none") ? "grid" : "none";
}

function handleManualYscaleClick() {

    let chartOptionsScalesYaxis0Ticks = chart.options.scales.yAxes[0].ticks;
    let isManualYscale = document.getElementById("manualYscale").checked;

    if (isManualYscale) {

        // Manual Yaxis range
        let yfrom = Number(document.getElementById("yfrom").value);
        let yto = Number(document.getElementById("yto").value);

        // Make smallest of yFrom and yTo the "from" and largest the "to" 
        if (yfrom > yto) {
            var temp = yfrom;
            yfrom = yto;
            yto = temp;
        }

        chartOptionsScalesYaxis0Ticks.min = yfrom;
        chartOptionsScalesYaxis0Ticks.max = yto;
    }
    else {
        // This forces auto range Yaxis
        chartOptionsScalesYaxis0Ticks.min = undefined;
        chartOptionsScalesYaxis0Ticks.max = undefined;

    }

    chart.update();
}

function handleYfromYtoInput() {

    let chartOptionsScalesYaxis0Ticks = chart.options.scales.yAxes[0].ticks;

    // Toggle between manual and auto ranging of Y
    if (document.getElementById("manualYscale").checked) { 

        let yfrom = Number(document.getElementById("yfrom").value);
        let yto = Number(document.getElementById("yto").value);

        if (yfrom > yto) {
            let temp = yfrom;
            yfrom = yto;
            yto = temp;
        }

        chartOptionsScalesYaxis0Ticks.min = yfrom;
        chartOptionsScalesYaxis0Ticks.max = yto;

    } else {

        chartOptionsScalesYaxis0Ticks.min = undefined;
        chartOptionsScalesYaxis0Ticks.max = undefined;
    }
    

    // Chart options that need setting regardles of auto/manual
    chart.options.maintainAspectRatio = false;
    chart.options.tooltips.enabled = false;
    chart.options.tooltips.custom = ctcb;

    chart.update();

}

function CalculateDateMinMax() {
    let min = "9999-12-31";
    let max = "0000-00-00";

    // Look for min/max result date in each enable dataset
    for (let i=0; i<maxPlayers; i++)
    {
        let playerName = document.getElementById("player" + i).value;

        if (chart.data.datasets[i].label == playerName) {
            contexts[playerName].forEach((context) => {
                if (context.match_date < min) min = context.match_date;
                if (context.match_date > max) max = context.match_date;
            })

        }
    }

    // This only happens when no players are selected hence no data to plot
    if ((min == "9999-12-31") || (max == "0000-00-00"))
    {
        min = undefined;
        max = undefined;
    }

    return {min: min, max: max};
}

function GetY(ar, playerName) {

    if (ar.visitor1_name == playerName) {
        return ar.visitor1_rating_after;
    } else if (ar.visitor2_name == playerName) {
        return ar.visitor2_rating_after;
    } else if (ar.home1_name == playerName) {
        return ar.home1_rating_after;
    } else if (ar.home2_name == playerName) {
        return ar.home2_rating_after;
    } else {
        return null;
    }

}

//const start = performance.now();   // High-resolution start time
// Code to measure
//const end = performance.now();   // High-resolution end time
//console.log(`JSON Execution time: ${(end - start).toFixed(3)} ms`);

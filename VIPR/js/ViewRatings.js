// Globals
"use strict";
const maxPlayers = 3;
const chartTitle = document.getElementById("title").innerText;
const lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255"];

var lookupSource;
var ratingsHistoryText;
var ratingsHistoryData;

var algoResults;
var ctcb;   // Custom Tooltip Call Back

const contexts = {};

const nameLookup = {};

var chartDatasets = [];
var chart;

// Once all html/javascript/css has loaded execute the handleOnLoad() function
async function handleOnLoad() {

    //const start = performance.now();   // High-resolution start time
    // Code to measure
    //const end = performance.now();   // High-resolution end time
    //console.log(`JSON Execution time: ${(end - start).toFixed(3)} ms`);

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
    let players = Object.values(nameLookup)//Object.keys(ratingsHistoryData);
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

    // For each of the (3) possible chart lines create a blank Dataset
    // This Dataset will be replaced when a player is selected from a "playerX" dropdown
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

    let dsi = chart.active[0]._datasetIndex;
    let xIndex = chart.active[0]._index;

    let playerName = chart.config.data.datasets[dsi].label;

    let context = (contexts[playerName])[xIndex];


    let innerHTML = `
      <div class="full_row">Date: ${context.match_date}, Match: ${context.match_id}, Game: ${context.game_number}</div>
    
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
    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
    tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
    tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
    tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
    tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
    tooltipEl.style.pointerEvents = 'none';
    
}
    let ctx = document.getElementById('myChart').getContext('2d');
        
    chart = new Chart(ctx, {
        type: "scatter",
        data: { datasets: chartDatasets },
        options: {
            title: { display: true, text: document.getElementById("title").innerText },
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
    
    var playerName = document.getElementById("player" + playerNumber).value;
    var lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255"];
    var chartDataset;
    let x = 1;
    let y;
    let dataArray = [];
    let contextArray = [];

    if (playerName != "") {

        // Build context and data arrays
        for (let i = 0; i < Object.keys(algoResults).length; i++){

            if ((algoResults[i]).visitor1_name == playerName) {
                y = (algoResults[i]).visitor1_rating_after;
            } else if ((algoResults[i]).visitor2_name == playerName) {
                y = (algoResults[i]).visitor2_rating_after;
            } else if ((algoResults[i]).home1_name == playerName) {
                y = (algoResults[i]).home1_rating_after;
            } else if ((algoResults[i]).home2_name == playerName) {
                y = (algoResults[i]).home2_rating_after;
            } else {
                y = null;
            }

            if (y) {
                dataArray.push({"x" : x++, "y": y});

                contextArray.push(algoResults[i]);
            };

        }
            
        contexts[playerName] = contextArray;

        chartDataset = {
            label: playerName,
            fill: false,
            showLine: true,
            steppedLine: document.getElementById("stepped").checked,
            lineTension: 0,
            pointRadius: 4,
            borderColor: lineColors[playerNumber],
            pointBackgroundColor: lineColors[playerNumber],
            data: dataArray
        };
    }
    else {

        chartDataset = {
            label: "Not Set",
            fill: false,
            showLine: true,
            steppedLine: document.getElementById("stepped").checked,
            lineTension: 0,
            pointRadius: 4,
            borderColor: lineColors[playerNumber],
            pointBackgroundColor: lineColors[playerNumber],
            data: [{ x: null, y: null }]
        };
    }

    chart.data.datasets[playerNumber] = chartDataset;

    chart.update();
}

function handleManualYscaleClick() {

    let chartOptions;
    let isManualYscale = document.getElementById("manualYscale").checked;

    if (isManualYscale) {

        let yfrom = Number(document.getElementById("yfrom").value);
        let yto = Number(document.getElementById("yto").value);

        if (yfrom > yto) {
            var temp = yfrom;
            yfrom = yto;
            yto = temp;
        }

        chartOptions = {
            animation: { duration: 0 },
            maintainAspectRatio: false,
            legend: { display: true, labels: { boxWidth: 12 } },
            tooltips: { enabled: false, custom: ctcb },
            scales: {
                yAxes: [{
                    ticks: {
                        min: yfrom, max: yto //, callback: function (value, index, values) { return Math.abs(value); }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "VIPR Rating",
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Week #"
                    }
                }]

            }
        }

    }
    else {

        chartOptions = {
            animation: { duration: 0 },
            maintainAspectRatio: false,
            legend: { display: true, labels: { boxWidth: 12 } },
            tooltips: { enabled: false, custom: ctcb },

            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "VIPR Rating",
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Week #"
                    }
                }]
            }
        }

    }

    chart.options = chartOptions;

    chart.update();
}


function handleSteppedClick() {
    let isChecked = document.getElementById("stepped").checked;

    chart.data.datasets.forEach(function (dataset) {
        dataset.steppedLine = isChecked;
    });

    chart.update();
}

function handleLegendVisibleClick() {
    let isChecked = document.getElementById("legendVisible").checked;

    //chart.options.legend.display = isChecked;
    chart.config.options.legend.display = isChecked;

    chart.update();
}

function handleTitleVisibleClick() {
    let isChecked = document.getElementById("titleVisible").checked;

    //chart.options.title.display = isChecked;
    chart.config.options.title.display = isChecked;

    chart.update();
}

function handleYfromYtoInput() {

    // Only run if in manual Y scale mode
    if (document.getElementById("manualYscale").checked) { 

        let yfrom = Number(document.getElementById("yfrom").value);
        let yto = Number(document.getElementById("yto").value);

        if (yfrom > yto) {
            let temp = yfrom;
            yfrom = yto;
            yto = temp;
        }

        let chartOptions = {
            animation: { duration: 0 },
            maintainAspectRatio: false,
            legend: { display: true, labels: { boxWidth: 12 } },
            tooltips: { enabled: false, custom: ctcb },
            scales: {
                yAxes: [{
                    ticks: { min: yfrom, max: yto },
                    scaleLabel: {
                        display: true,
                        labelString: "Ranking",
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Week #"
                    }
                }]

            }
        }

        chart.options = chartOptions;

        chart.update();
    }
}

function toggleSettingsVisibility() {
    let settingsDisplay = document.getElementById("settings").style.display;
    document.getElementById("chartHolder").style.height = (settingsDisplay == "none") ? "80vh" : "88vh";
    document.getElementById("settings").style.display = (settingsDisplay == "none") ? "grid" : "none";
}

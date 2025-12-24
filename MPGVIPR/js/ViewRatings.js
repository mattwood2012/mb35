// Globals
"use strict";
const version = " V0.1";
const player_uid = "49d40ef4a000349ccbc15c5e";
const chartTitle = document.getElementById("title").innerText;

var algoResults;
var ctcb;   // Custom Tooltip Call Back

const contexts = [];    // Holds meta data (partner, opponents, scores etc.) that is displayed in tooltip

const nameLookup = {};

var chart;
var playerName;
var pwd = prompt("Please enter your password:");

const chartDatasets = [];
const playerResults = [];

// Once all html/javascript/css has loaded initialize everything
async function handleOnLoad() {

    // Create hash from password
    let hash = await hashString(pwd);
    let resultsFilename = hash.substring(20,10) + "_mens.json";

    // Real code will just gets back match results for selected player but for now extract it from all data
    // First read the results document (players names, before and after ratings etc.)
    try {
        let response = await fetch("data/" + resultsFilename);
        let textResults = await response.text();
        algoResults = JSON.parse(textResults);
    } catch (err) {
        alert("Incorrect password. Click OK to close this dialog then refresh the page to try again");
        return;
    }

    // Create an array of results for games player played in
    let dateXaxis = document.getElementById("datex").checked;
    let x = 1;
    let y = 0;
    let dataArray = [];

    algoResults.forEach((ar) => {

        let playerInGame = ar.visitor1_uid == player_uid ||
                            ar.visitor2_uid == player_uid ||
                            ar.home1_uid == player_uid ||
                            ar.home2_uid == player_uid;
                            
        if ( playerInGame) {
            playerResults.push(ar);

            y = GetY(ar, player_uid);
            
            if (y) {
                if (dateXaxis) {
                    dataArray.push({x : (ar).match_date, y: y});
                } else {
                    dataArray.push({x: x++, y: y});
                }

                contexts.push(ar);
            };
        }
    })
    
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
        let xIndex = chart.active[0]._index;
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


    const chartDataset = {
        label: playerName,
        fill: false,
        showLine: true,
        steppedLine: true,
        lineTension: 0,
        pointRadius: 4,
        borderColor: "rgb(247,136,47)",
        pointBackgroundColor: "rgb(247,136,47)",
        data: dataArray
    }

    // Create the chart
    let ctx = document.getElementById('myChart').getContext('2d');
        
    chart = new Chart(ctx, {
        type: "scatter",
        data: { datasets: [chartDataset] },
        options: {
            title: { display: true, text: playerName + ": " + document.getElementById("title").innerText + version },
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

// Toggle between linear Game # and Date on x-axis
function handleDatexClick() {

    let cddd = chart.data.datasets[0].data;
    cddd.length = 0;
    let dateXaxis = document.getElementById("datex").checked;
    let x = 1;
    let y;
    
    contexts.forEach((context) => {
        y = GetY(context, player_uid);
        
        if (y) {
            if (dateXaxis) {
                cddd.push({x : context.match_date, y: y});
            } else {
                cddd.push({x: x++, y: y});
            }
        };

    });

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

    chart.config.options.legend.display = isChecked;

    chart.update();
}

function handleTitleVisibleClick() {
    let isChecked = document.getElementById("titleVisible").checked;

    chart.config.options.title.display = isChecked;

    chart.update();
}

function CalculateDateMinMax() {
    let min = "9999-12-31";
    let max = "0000-00-00";

    contexts.forEach((context) => {
        if (context.match_date < min) min = context.match_date;
        if (context.match_date > max) max = context.match_date;
    });

    // This only happens when no game results exist for player
    if ((min == "9999-12-31") || (max == "0000-00-00"))
    {
        min = undefined;
        max = undefined;
    }

    return {min: min, max: max};
}

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

async function hashString(message) {
    try {
        // Encode the string as UTF-8
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        // Perform the digest operation
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);

        // Convert ArrayBuffer to byte array
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        // Convert bytes to hex string
        const hashHex = hashArray
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return hashHex;
    } catch (err) {
        console.error('Hashing failed:', err);
        throw err;
    }
}




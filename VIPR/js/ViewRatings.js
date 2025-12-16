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

async function handleOnLoad() {

    // First read document that has mail to name data and create lookup
    //let response = await fetch("data/Vipr_Player_Progressions_Wide.json");
    let response = await fetch("data/Vipr_Player_Progressions_Wide.json");
    let json = await response.text();
    let lookupInfo = JSON.parse(json);

    lookupInfo.forEach((playerRatingHistory) => {
        nameLookup[playerRatingHistory.email] = playerRatingHistory.PlayerName;
    })
    
    // Read context associated with each game (players names, before and after ratings etc.)
    response = await fetch("data/ViprAlgoResults.json");
    let jsonResults = await response.text();

    // Get context information as an array of objects
    // const start = performance.now(); // High-resolution start time
    
    algoResults = JSON.parse(jsonResults);
    
    //const end = performance.now();   // High-resolution end time
    //console.log(`JSON Execution time: ${(end - start).toFixed(3)} ms`);

    // Update algoResults to have visitor1_name, visitor2_name, home1_name, home2_name properties
    algoResults.forEach((ar) => {
        ar["visitor1_name"] = nameLookup[ar["visitor_player1_email"]];
        ar["visitor2_name"] = nameLookup[ar["visitor_player2_email"]];
        ar["home1_name"] = nameLookup[ar["home_player1_email"]];
        ar["home2_name"] = nameLookup[ar["home_player2_email"]];
    })
    
    // Load player drop downs
    // All players in alphabetically sorted order
    let players = Object.values(nameLookup)//Object.keys(ratingsHistoryData);
    players.sort();

    for (var i = 0; i < maxPlayers; i++) {
        var selectPlayer = document.getElementById("player" + i);

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

        var newDataset = Object.create(chartDataset);
        chartDatasets.push(newDataset);

    }

    var ctx = document.getElementById('myChart').getContext('2d');

    var ttcb = function toolTipCallback(tooltipItem, data) {

        let tIDsi = tooltipItem.datasetIndex;
        let playerName = (data.datasets[tIDsi]).label;
        let xPointIndex = tooltipItem.xLabel-1;
        let context = (contexts[playerName])[xPointIndex];
        let deltaRating = 0;
        let score = "";

        //let context = algoResults[contextIndex];

        console.log(JSON.stringify(context, null, 2));

        // Add partner and opponents names to tooltip
        let players = " with ";
        if (playerName == context.home1_name) {
            players += context.home2_name + " vs " + context.visitor1_name + " and " + context.visitor2_name ;
            deltaRating = context.home_player1_rating_final - context.home_player1_rating_initial
            score = String(context.home_points) + "-" + String(context.visitor_points);
        } else if (playerName == context.home2_name) {
            players += context.home1_name + " vs " + context.visitor1_name + " and " + context.visitor2_name;
            deltaRating = context.home_player2_rating_final - context.home_player2_rating_initial
            score = String(context.home_points) + "-" + String(context.visitor_points);
        } else if (playerName == context.visitor1_name) {
            players += context.visitor2_name + " vs " + context.home1_name + " and " + context.home2_name;
            deltaRating = context.visitor_player1_rating_final - context.visitor_player1_rating_initial
            score = String(context.visitor_points) + "-" + String(context.home_points);
        } else {
            players += context.visitor1_name + " vs " + context.home1_name + " and " + context.home2_name
            deltaRating = context.visitor_player2_rating_final - context.visitor_player2_rating_initial
            score = String(context.visitor_points) + "-" + String(context.home_points);
        };

        return context["match_date"] + " Game " + context["game_number"] + " (" + score + ")" + players + " " + " \u0394: " + deltaRating.toFixed(3);
        //return data.datasets[tooltipItem.datasetIndex].label + " Week " + tooltipItem.label + ": " + tooltipItem.value;
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

    function getBody(bodyItem) {
        return bodyItem.lines;
    }

    // Set Text
    // if (tooltipModel.body) {
    //     var titleLines = tooltipModel.title || [];
    //     var bodyLines = tooltipModel.body.map(getBody);

    //     var innerHtml = '<thead>';

    //     titleLines.forEach(function(title) {
    //         innerHtml += '<tr><th>' + title + '</th></tr>';
    //     });
    //     innerHtml += '</thead><tbody>';

    //     bodyLines.forEach(function(body, i) {
    //         var colors = tooltipModel.labelColors[i];
    //         var style = 'background:' + colors.backgroundColor;
    //         style += '; border-color:' + colors.borderColor;
    //         style += '; border-width: 2px';
    //         var span = '<span style="' + style + '"></span>';
    //         innerHtml += '<tr><td>' + span + body + '</td></tr>';
    //     });
    //     innerHtml += '</tbody>';

    //     var tableRoot = tooltipEl.querySelector('table');
    //     tableRoot.innerHTML = innerHtml;
    // }


    // <div class="container">
    // </div>`;

let innerHTML = `

    <div class="full_row">Date: 2025-10-06, Match: 3-M001, Game: 1</div>
    <div></div>

      <div class="name_holder">Players</div>
      <div class="data_holder">Before</div>
      <div class="data_holder">After</div>
      <div class="data_holder">Delta</div>
      <div class="data_holder">Score</div>

      <div class="name_holder">Visitor&nbsp;1:</div>
      <div class="name_holder">Mark&nbsp;Attwood</div>
      <div class="data_holder">4.567</div>
      <div class="data_holder">4.678</div>
      <div class="data_holder">0.111</div>

      <div class="name_holder">Visitor&nbsp;2:</div>
      <div class="name_holder">Jim&nbsp;Doran</div>
      <div class="data_holder">6.543</div>
      <div class="data_holder">6.654</div>
      <div class="data_holder">0.111</div>
      <div class="visitors-score">11</div>

      <div class="name_holder">Home&nbsp;1:</div>
      <div class="name_holder">John&nbsp;Doe</div>
      <div class="data_holder">4.234</div>
      <div class="data_holder">4.123</div>
      <div class="data_holder">-0.111</div>

      <div class="name_holder">Home&nbsp;2:</div>
      <div class="name_holder">Ben&nbsp;Johns</div>
      <div class="data_holder">3.000</div>
      <div class="data_holder">2.889</div>
      <div class="data_holder">-0.111</div>
      <div class="home-score">8</div>

      <div class="full_row">crf: 0.0, scale: 0.1, curve: 2.0, algo_type: Elo</div>`;


        //var tooltipDiv = tooltipEl.querySelector('div');
        tooltipEl.innerHTML = innerHTML;

    // `this` will be the overall tooltip
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
    chart = new Chart(ctx, {
        type: "scatter",
        data: { datasets: chartDatasets },
        options: {
            //tooltips: { enabled: true, custom: function (tooltipModel) { var ttm = tooltipModel; } },
            title: { display: true, text: document.getElementById("title").innerText },
            tooltips: { enabled: false, custom: ctcb },
            animation: { duration: 0 },
            maintainAspectRatio: false,
            legend: { display: true, labels: { boxWidth: 12 } },
            scales: {
                yAxes: [{
                    // ticks: {
                    //     callback: function (value, index, values) {
                    //         return Math.abs(value);
                    //     }
                    // },
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

            if ((algoResults[i])["visitor1_name"] == playerName) {
                y = (algoResults[i])["visitor_player1_rating_final"];
            } else if ((algoResults[i])["visitor2_name"] == playerName) {
                y = (algoResults[i])["visitor_player2_rating_final"];
            } else if ((algoResults[i])["home1_name"] == playerName) {
                y = (algoResults[i])["home_player1_rating_final"];}
            else if ((algoResults[i])["home2_name"] == playerName) {
                y = (algoResults[i])["home_player2_rating_final"];
            } else {
                y = null;
            }

            if (y) {
                dataArray.push({"x" : x++, "y": y});

                contextArray.push(algoResults[i]);
            };

            //contexts[playerName] = contextArray;

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

    var chartOptions;
    var isManualYscale = document.getElementById("manualYscale").checked;

    if (isManualYscale) {

        var yfrom = Number(document.getElementById("yfrom").value);
        var yto = Number(document.getElementById("yto").value);

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
    var isChecked = document.getElementById("stepped").checked;

    chart.data.datasets.forEach(function (dataset) {
        dataset.steppedLine = isChecked;
    });

    chart.update();
}

function handleLegendVisibleClick() {
    var isChecked = document.getElementById("legendVisible").checked;

    //chart.options.legend.display = isChecked;
    chart.config.options.legend.display = isChecked;

    chart.update();
}

function handleTitleVisibleClick() {
    var isChecked = document.getElementById("titleVisible").checked;

    //chart.options.title.display = isChecked;
    chart.config.options.title.display = isChecked;

    chart.update();
}

function handleYfromYtoInput() {

    // Only run if in manual Y scale mode
    if (document.getElementById("manualYscale").checked) { 

        var yfrom = Number(document.getElementById("yfrom").value);
        var yto = Number(document.getElementById("yto").value);

        if (yfrom > yto) {
            var temp = yfrom;
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
    var settingsDisplay = document.getElementById("settings").style.display;
    document.getElementById("chartHolder").style.height = (settingsDisplay == "none") ? "80vh" : "88vh";
    document.getElementById("settings").style.display = (settingsDisplay == "none") ? "grid" : "none";
}

function handleCanvasClick(e) {
//    var activePoints = chart.getElementsAtEvent(e);
//    var meta = chart.getDatasetMeta(0);
//    var ds = chart.data.datasets[0]; // use index not 0!
}

// // Simple CSV parser (supports quoted fields)
// function parseCSV(text) {
//     const rows = [];
//     let current = '';
//     let row = [];
//     let inQuotes = false;

//     for (let i = 0; i < text.length; i++) {
//         const char = text[i];
//         const nextChar = text[i + 1];

//         if (char === '"' && inQuotes && nextChar === '"') {
//             // Escaped quote
//             current += '"';
//             i++;
//         } else if (char === '"') {
//             inQuotes = !inQuotes;
//         } else if (char === ',' && !inQuotes) {
//             row.push(current);
//             current = '';
//         } else if ((char === '\n' || char === '\r') && !inQuotes) {
//             if (current || row.length > 0) {
//                 row.push(current);
//                 rows.push(row);
//                 row = [];
//                 current = '';
//             }
//         } else {
//             current += char;
//         }
//     }

//     // Add last value if exists
//     if (current || row.length > 0) {
//         row.push(current);
//         rows.push(row);
//     }

//     return rows;
// }
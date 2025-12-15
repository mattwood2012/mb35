// Globals
"use strict";

// control dial settings - think of a better name! 
var infos = ["crf0","crf25", "crf50", "crf75", "crf100"]; 
const baseFilename = "data/ViprAlgoResults";
const allResults = {};
const nameLookup = {};
const contexts = {};

const chartTitle = document.getElementById("title").innerText;
const lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255", "rgb(127,127,127", "rgb(0,0,0", "rgb(0,255,255"];

var allRatingsHistory = {};
//var ratingsHistoryData;
var infoIndex = 0;

var chartDatasets = new Array();
var chart;

async function handleOnLoad() {
    // Use url query string, if present, to specify files
    let search = window.location.search;
    if (search) {
        let filenameEnding = (search.split("=",))[1];
        infos = filenameEnding.split(",");
    }

    // ***** Tempory until UId and name are in data/ViprAlgoResults.json *****
    // First read document that has mail to name data and create lookup
    let response = await fetch("data/Vipr_Player_Progressions_Wide.json");
    let json = await response.text();
    let lookupInfo = JSON.parse(json);

    lookupInfo.forEach((playerRatingHistory) => {
        nameLookup[playerRatingHistory.email] = playerRatingHistory.PlayerName;
    })
    

    // Load the ViprAlgoResults_xxx.json into contexts
    for (let i=0; i<infos.length; i++) {
        let info = infos[i];
        let fileName = baseFilename + "_" + info + ".json";

        // Get one set (ViprAlgoResults_info.json) of ViprAlgoResults
        response = await fetch(fileName);
        let jsonResults = await response.text();
        let algoResults = JSON.parse(jsonResults);

        // Temp until ViprAlgoResults.json comes with player names
        algoResults.forEach((ar) => {
            ar["visitor1_name"] = nameLookup[ar["visitor_player1_email"]];
            ar["visitor2_name"] = nameLookup[ar["visitor_player2_email"]];
            ar["home1_name"] = nameLookup[ar["home_player1_email"]];
            ar["home2_name"] = nameLookup[ar["home_player2_email"]];
        })

        allResults[info] = algoResults;
    };

    // Load player drop down
    // All players in alphabetically sorted order
    let players = Object.values(nameLookup)//Object.keys(ratingsHistoryData);
    players.sort();

    var selectPlayer = document.getElementById("player0");

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
    
    // Create starting chart dataset for each set of results
    for (let i=0; i<infos.length; i++) {

        const chartDataset = {
            label: infos[i],
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

    var ctx = document.getElementById('myChart').getContext('2d');

    var ttcb = function toolTipCallback(tooltipItem, data) {

        let tIDsi = tooltipItem.datasetIndex;
        let  playerName= document.getElementById("player0").value;
        let infoName = (data.datasets[tIDsi]).label;
        let xPointIndex = tooltipItem.xLabel-1;
        let context = (contexts[infoName])[xPointIndex];
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

        return infoName + " " + context["match_date"] + " Game " + context["game_number"] + " (" + score + ")" + players + " " + " \u0394: " + deltaRating.toFixed(3);


        //return data.datasets[tooltipItem.datasetIndex].label + " Week " + tooltipItem.label + ": " + tooltipItem.value;
    }    

    // Finally create the chart
    chart = new Chart(ctx, {
        type: "scatter",
        data: { datasets: chartDatasets },
        options: {
            //tooltips: { enabled: true, custom: function (tooltipModel) { var ttm = tooltipModel; } },
            title: { display: true, text: document.getElementById("title").innerText },
            tooltips: {
                enabled: true, callbacks: { label: ttcb } },

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

// Change the data being charted when selected playere name changes
function handlePlayerChange(playerNumber) {
    var playerName = document.getElementById("player0").value;

    let y;

    // const start = performance.now();
    // Code to measure
    // Create a ChartDataset for each model (i.e. different control dial settings)
    for (let modelIndex=0; modelIndex<infos.length; modelIndex++) {
        if (playerName != "") {

            const dataArray = [];
            const contextArray = [];
            let x = 1;

            let algoResults = allResults[infos[modelIndex]];

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
            }

            contexts[infos[modelIndex]] = contextArray;


            const chartDataset = {
                // all except data set in handleOnLoad
                label: infos[modelIndex],
                fill: false,
                showLine: true,
                steppedLine: document.getElementById("stepped").checked,
                lineTension: 0,
                pointRadius: 4,
                borderColor: lineColors[modelIndex],
                pointBackgroundColor: lineColors[modelIndex],
                data: dataArray
            };
            chart.data.datasets[modelIndex] = chartDataset;
        }
        else {

            const chartDataset = {
                label: infos[modelIndex],
                fill: false,
                showLine: true,
                steppedLine: document.getElementById("stepped").checked,
                lineTension: 0,
                pointRadius: 4,
                borderColor: lineColors[modelIndex],
                pointBackgroundColor: lineColors[modelIndex],
                data: [{ x: null, y: null }]
            };
            chart.data.datasets[modelIndex] = chartDataset;
        }
    }

    
// const end = performance.now();
// console.log(`Execution time: ${end - start} ms`);



    //chart.data.datasets[playerNumber] = chartDataset;

    chart.update();
}

// var ytcb = function yTicksCallback(value) {
//     return Math.abs(value);
// }

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
            scales: {
                yAxes: [{
                    //ticks: { callback: function (value, index, values) { return Math.abs(value); } },
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

        chartOptions = {
            animation: { duration: 0 },
            maintainAspectRatio: false,
            legend: { display: true, labels: { boxWidth: 12 } },
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

// Simple CSV parser (supports quoted fields)
function parseCSV(text) {
    const rows = [];
    let current = '';
    let row = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            row.push(current);
            current = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (current || row.length > 0) {
                row.push(current);
                rows.push(row);
                row = [];
                current = '';
            }
        } else {
            current += char;
        }
    }

    // Add last value if exists
    if (current || row.length > 0) {
        row.push(current);
        rows.push(row);
    }

    return rows;
}
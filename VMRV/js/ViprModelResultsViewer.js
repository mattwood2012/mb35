// Globals
var infos = ["crf0","crf25", "crf50", "crf75", "crf100"];
const baseFilename = "data/Vipr_Player_Progressions_Wide";
const allRatings = {};
const csvResults = {};

const chartTitle = document.getElementById("title").innerText;
const lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255", "rgb(127,127,127", "rgb(0,0,0", "rgb(0,255,255"];

var allRatingsHistory = {};
//var ratingsHistoryData;
var infoIndex = 0;

var chartDatasets = new Array();
var chart;

function handleOnLoad() {
    // Use url query string, if present, to specify files
    let search = window.location.search;
    if (search) {
        //let s1 = search.substring(7);
        let s2 = (search.split("=",))[1];
        infos = s2.split(",");
    }

    infos.forEach((info) => {
        const fileName = baseFilename + "_" + info + ".csv";
        const request = new XMLHttpRequest();
        request.open('GET', fileName, true);
        request.responseType = '';
        
        
        request.onload = function() {
            if (request.status === 200) {
                csvResults[info] = request.responseText;

                if (++infoIndex == infos.length){
                    initialize();
                }
            }
        };

        request.send();
    });

}

function initialize(){

    // First load csv formatted for chart.js into allRatingsHistory that has a property of "model description" (e.g. crf25) for each model
    for (let infoIndex=0; infoIndex<infos.length; infoIndex++) {
        csv = csvResults[infos[infoIndex]]
        rows = parseCSV(csv);
        numRows = rows.length;
        
        const ratingsHistoryData = {};

        for (let i = 1; i < numRows; i++) {
            let name = (rows[i])[1];
            let points = [];
            for (let j=2; j < rows[i].length; j++){
                let y = (rows[i])[j]
                if (y){
                    let point = {};
                    point.x = j-1;
                    point.y = y;
                    points.push(point)
                }
            }
            
            ratingsHistoryData[name] = points;
        }
        allRatingsHistory[infos[infoIndex]] = ratingsHistoryData;

    }

    // Get all players in alphabetically sorted order
    // All models have the same players so just use first model
    var players = Object.keys(allRatingsHistory[infos[0]]);
    players.sort();

    // Load player drop down 
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

    // Initialize chart for each model
    for (let i = 0; i < infos.length; i++) {

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
        return data.datasets[tooltipItem.datasetIndex].label + " Week " + tooltipItem.label + ": " + tooltipItem.value;
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

    //document.getElementById("myChart").onclick = handleCanvasClick;

    chart.update();

}

function handlePlayerChange(playerNumber) {
    var playerName = document.getElementById("player" + playerNumber).value;

    // Create a ChartDataset for each model
    for (let modelIndex=0; modelIndex<infos.length; modelIndex++) {
        if (playerName != "") {

            const chartDataset = {
                label: infos[modelIndex],
                fill: false,
                showLine: true,
                steppedLine: document.getElementById("stepped").checked,
                lineTension: 0,
                pointRadius: 4,
                borderColor: lineColors[modelIndex],
                pointBackgroundColor: lineColors[modelIndex],
                data: (allRatingsHistory[infos[modelIndex]])[playerName]
            };
            chart.data.datasets[modelIndex] = chartDataset;
        }
        else {

            const chartDataset = {
                label: "Not Set",
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
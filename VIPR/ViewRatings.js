// Globals
const maxPlayers = 3;
const chartTitle = document.getElementById("title").innerText;
const lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255"];

var ratingsHistoryText;
var ratingsHistoryData;

var chartDatasets = new Array();
var chart;

function handleOnLoad() {

    rankingsHistoryData = {
        "Player 1": [{ "x": 1, "y": 1 }, { "x": 2, "y": 2 }, { "x": 3, "y": 3 }],
        "Player 2": [{ "x": 1, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 1 }],
        "Player 3": [{ "x": 1, "y": 2 }, { "x": 2, "y": 3 }, { "x": 3, "y": 2 }]
    }

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            // Action to be performed when the document is read;
            csv = xhttp.responseText;
            rows = parseCSV(xhttp.responseText);
            numRows = rows.length;
            //let rHD = {};

            let y = 0;
            let jStr = '{';
            let j = 1;

            for (let i = 1; i < numRows; i++) {
                jStr += '"' + rows[i][0] + '":[';
                for (j = 1; j < rows[i].length - 1; j++) {
                    y = (rows[i])[j];
                    if (y) {
                        jStr += '{"x":' + j.toString() + ',"y":' + y.toString() + '}';
                        if ((j < rows[i].length - 1) && (rows[i])[j+1]) {jStr += ',';}
                    }
                }
                // Because we do 1 less than actual columns
                if ((rows[i])[j]) {
                        jStr += '{"x":' + j.toString() + ',"y":' + y.toString() + '}';
                    }

                jStr += ']';
                if (i < (numRows - 1)) {jStr += ',';}

            } 
            jStr += '}';

            console.log(jStr);
            //ratingsHistoryText = '{"Player 9": [{ "x": 1, "y": 1 }, { "x": 2, "y": 2 }, { "x": 3, "y": 3 }], "Player 2": [{ "x": 1, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 1 }],"Player 3": [{ "x": 1, "y": 2 }, { "x": 2, "y": 3 }, { "x": 3, "y": 2 }]}'
            ratingsHistoryData = JSON.parse(jStr);



/*             rankingsHistoryData = {
                "Player 9": [{ "x": 1, "y": 1 }, { "x": 2, "y": 2 }, { "x": 3, "y": 3 }],
                "Player 2": [{ "x": 1, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 1 }],
                "Player 3": [{ "x": 1, "y": 2 }, { "x": 2, "y": 3 }, { "x": 3, "y": 2 }]
            }
 */            
            // Load player drop downs
            // All players in alphabetically sorted order
            var players = Object.keys(ratingsHistoryData);
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



        }
    };
    xhttp.open("GET", "./Vipr_Player_Progressions_Wide.csv", true);
    xhttp.send();

  
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
        return data.datasets[tooltipItem.datasetIndex].label + " Week " + tooltipItem.label + ": " + Math.abs(tooltipItem.value);
    }

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
                    ticks: {
                        callback: function (value, index, values) {
                            return Math.abs(value);
                        }
                    },
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
    var lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255"];
    var chartDataset;

    if (playerName != "") {

        // Create data array - deep copy - and make negative!
        let rHDP = ratingsHistoryData[playerName];
        let jsonString = JSON.stringify(rHDP);
        const dA = JSON.parse(jsonString);
        const dataArray = JSON.parse(JSON.stringify(ratingsHistoryData[playerName]));

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

var ytcb = function yTicksCallback(value) {
    return Math.abs(value);
}

function handleManualYscaleClick() {

    var chartOptions;
    var isManualYscale = document.getElementById("manualYscale").checked;

    if (isManualYscale) {

        var yfrom = -Number(document.getElementById("yfrom").value);
        var yto =- Number(document.getElementById("yto").value);

        if (yfrom < yto) {
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
                        min: yfrom, max: yto, callback: function (value, index, values) { return Math.abs(value); }
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
                    ticks: { callback: function (value, index, values) { return Math.abs(value); } },
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

        var yfrom = -Number(document.getElementById("yfrom").value);
        var yto = -Number(document.getElementById("yto").value);

        if (yfrom < yto) {
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

// Globals
var chart;
const maxPlayers = 3;
const chartTitle = document.getElementById("title").innerText;

function handleOnLoad() {

    //rankingsHistoryData = {
    //    "Player 1": [{ "x": 1, "y": 1 }, { "x": 2, "y": 2 }, { "x": 3, "y": 3 }],
    //    "Player 2": [{ "x": 1, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 1 }],
    //    "Player 3": [{ "x": 1, "y": 2 }, { "x": 2, "y": 3 }, { "x": 3, "y": 2 }]
    //}

    rankingsHistoryData = {
        "Player 1": [{ "x": 1, "y": 1 }, { "x": 2, "y": 2 }, { "x": 3, "y": 3 }],
        "Player 2": [{ "x": 1, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 1 }],
        "Player 3": [{ "x": 1, "y": 2 }, { "x": 2, "y": 3 }, { "x": 3, "y": 2 }]
    }

    var lineColors = ["rgb(255,0,0", "rgb(0,255,0", "rgb(0,0,255"];

    var chartDatasets = new Array();

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

    // Load player drop downs
    // All players in alphabetically sorted order
    var players = Object.keys(rankingsHistoryData);
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
        const dataArray = JSON.parse(JSON.stringify(rankingsHistoryData[playerName]));


        //dataArray.forEach(function (point) {
        //    point.y = -point.y;
        //})

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

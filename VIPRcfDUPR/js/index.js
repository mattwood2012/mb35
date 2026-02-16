"use strict";

async function handleChart() {
    window.location.href = await getReportURL("vipr_chart.html");
};

async function handleViprStats() {
    window.location.href = await getReportURL("vipr_stats.html");
};

async function handleDuprStats() {
    window.location.href = await getReportURL("dupr_stats.html");
};

async function getReportURL(reportURL) {
    const league = document.getElementById("leagueSelect");
    const pwd = document.getElementById("pwd");

    // First param (league) is always present, hash is optional
    const leagueParam = `?league=${league.value}`;
    
    if (pwd.value) {
        const hash = await hashString(pwd.value);
        const hashParam = `&hash=${hash.substring(0, 16)}`;
        return reportURL + leagueParam + hashParam;
    } else {
        return reportURL + leagueParam;
    }
};

async function hashString(message) {
    // Encode the string as UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Do hash operation
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert ArrayBuffer to byte array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Convert bytes to hex string
    const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return hashHex;
}

function isParamValid(param) {
    return param !== null && param !== undefined && param !== "";
}

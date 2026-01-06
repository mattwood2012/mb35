"use strict";
// const league = document.getElementById("leagueSelect");
// const pwd = document.getElementById("pwd");

// Read query string uid parameter
const params = new URLSearchParams(window.location.search);

let uid = params.get('uid'); // ID of player for the chart or stats pages
let uidParam = "";
if (isParamValid(uid)) {
    uidParam = `&uid=${uid}`;
};

async function handleChart() {
    const league = document.getElementById("leagueSelect");
    const pwd = document.getElementById("pwd");

    // First param (league) is always present. uid and hash are optional
    const leagueParam = `?league=${league.value}`;
    
    if (pwd.value) {
        const hash = await hashString(pwd.value);
        const hashParam = `&hash=${hash.substring(0, 16)}`;
        window.location.href = "vipr_chart.html" + leagueParam + hashParam + uidParam;
    } else {
        window.location.href = "vipr_chart.html" + leagueParam + uidParam;
    }
};

async function handleStats() {
    const league = document.getElementById("leagueSelect");
    const pwd = document.getElementById("pwd");

    // First param (league) is always present. uid and hash are optional
    const leagueParam = `?league=${league.value}`;
    
    if (pwd.value) {
        const hash = await hashString(pwd.value);
        const hashParam = `&hash=${hash.substring(0, 16)}`;
        window.location.href = "vipr_stats.html" + leagueParam + hashParam + uidParam;
    } else {
        window.location.href = "vipr_stats.html" + leagueParam + uidParam;
    }
};

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
        return "";
    }
}

function isParamValid(param) {
    return param !== null && param !== undefined && param !== "";
}

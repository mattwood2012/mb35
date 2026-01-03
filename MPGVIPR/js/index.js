"use strict";
const league = document.getElementById("leagueSelect");
const pwd = document.getElementById("pwd");

async function handleChart() {
    const league = document.getElementById("leagueSelect");
    const pwd = document.getElementById("pwd");
    if (pwd.value) {
        const hash = await hashString(pwd.value);
        window.location.href = `vipr_chart.html?hash=${hash.substring(20,10)}&league=${league.value}`;
    } else {
        window.location.href = `vipr_chart.html?hash=${null}&league=${league.value}`;
    }
};

async function handleStats() {
    const league = document.getElementById("leagueSelect");
    const pwd = document.getElementById("pwd");
    if (pwd.value) {
        const hash = await hashString(pwd.value);
        window.location.href = `vipr_stats.html?hash=${hash.substring(20,10)}&league=${league.value}`;
    } else {
        window.location.href = `vipr_stats.html?hash=${null}&league=${league.value}`;
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

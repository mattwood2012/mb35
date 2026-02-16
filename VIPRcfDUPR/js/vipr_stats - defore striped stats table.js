// Globals
"use strict";
const version = " V0.2.0";

var gameResults;

const nameLookup = {};
const uidLookup = {};

async function handleOnLoad() {

    // Read query string parameters
    const params = new URLSearchParams(window.location.search);
    let league = params.get('league'); // only mens85plus for now
    
    if (!isParamValid(league)) {
        league = "mens85plus";
    }

    // // Use sanitized data if no password
    const leagueName = (league == "mens85plus") ? "Mens 8.5+ PYP" : "Men's League"; // Change to object
    let resultsFilename = `${league}_sanitized.json`;

    const hash = params.get('hash'); // Hash of top secret password
    if (isParamValid(hash)) {
        resultsFilename = `${league}_${hash}.json`;
    }

    // Real code will just gets back match results for selected player but for now extract it from all data
    // First read the results document (players names, before and after ratings etc.)
    let response = await fetch("data/" + resultsFilename);
    let textResults = await response.text();
    gameResults = JSON.parse(textResults);

    // Display league name before player dropdown
    document.getElementById("leagueName").innerHTML = `${leagueName}:`;

    gameResults.forEach((gr) => {
        if (! nameLookup[gr.visitor1_uid]) {
          nameLookup[gr.visitor1_uid] = gr.visitor1_name;
          uidLookup[gr.visitor1_name] = gr.visitor1_uid;
        }
        if (! nameLookup[gr.visitor2_uid]) {
          nameLookup[gr.visitor2_uid] = gr.visitor2_name;
          uidLookup[gr.visitor2_name] = gr.visitor2_uid;
        }
        if (! nameLookup[gr.home1_uid]) {
          nameLookup[gr.home1_uid] = gr.home1_name;
          uidLookup[gr.home1_name] = gr.home1_uid;
        }
        if (! nameLookup[gr.home2_uid]) {
          nameLookup[gr.home2_uid] = gr.home2_name;
          uidLookup[gr.home2_name] = gr.home2_uid;
        }
    });

    // Load player drop downs
    // A message line followed by all players in alphabetically sorted order
    let selectPlayer = document.getElementById("player");

    let players = Object.values(nameLookup);
    players.sort();
    
    // First line: Prompt user to select a player
    let opt = document.createElement("option");
    opt.textContent = "-- Select a Player --";
    opt.value = "";
    opt.style.color = "#cccccc"
    selectPlayer.appendChild(opt);

    // Add all names in alphabetical order after prompt line
    players.forEach(function (player) {
        let opt = document.createElement("option");
        opt.textContent = player;
        opt.value = uidLookup[player];
        selectPlayer.appendChild(opt);
    })

  }

function handlePlayerChange() {

  // Participants labels
  let playerName = "";
  let partnerLabel;
  let teamLabel;
  let otherTeamLabel;

  // ststs variables
  let totalGames = 0;
  let gamesWon = 0;
  let gamesLost = 0;

  let totalPointsFor = 0;
  let totalPointsAgainst = 0;

  let currentViprRating = 0;
  let minViprRating = Number.MAX_SAFE_INTEGER;
  let maxViprRating = Number.MIN_SAFE_INTEGER;
  let accumulatedViprRating = 0;

  let minDeltaViprRating = Number.MAX_SAFE_INTEGER;
  let maxDeltaViprRating = Number.MIN_SAFE_INTEGER;
  let accumulatedDeltaViprRating = 0;

  let winRun = 0;
  let lossRun = 0;

  let maxLossStreak = 0;
  let maxWinStreak = 0;

  // Game results variables
  let resultsText = [];
  const player_uid = document.getElementById("player").value;

  gameResults.forEach((gr) => {

      const playerLabel = GetPlayerLabel(player_uid, gr);
      
      // if playerLabel != null then player_uid played in this game
      if ( playerLabel && (gr.winner != "tie")) {
        totalGames++;

        if (playerName == "") playerName = gr[playerLabel+ "_name"];

        // Get if player is home of visitor
        teamLabel = playerLabel.substring(0, playerLabel.length-1);
        otherTeamLabel = (teamLabel == "home") ? "visitor" : "home";

        if (teamLabel == "home"){
          partnerLabel = (playerLabel == "home1") ? "home2" : "home1";
        } else {
          partnerLabel = (playerLabel == "visitor1") ? "visitor2" : "visitor1";
        }

        if (gr.winner == teamLabel) {
          gamesWon++;
          winRun++;
          lossRun = 0;
          maxWinStreak = Math.max(maxWinStreak,winRun);
        } else {
          gamesLost++;
          lossRun++;
          winRun = 0;
          maxLossStreak = Math.max(maxLossStreak,lossRun);
        }

        totalPointsFor += gr[teamLabel + "_points"];
        totalPointsAgainst += gr[otherTeamLabel + "_points"];

        currentViprRating = gr[playerLabel + "_rating_after"];
        accumulatedViprRating += currentViprRating;
        minViprRating = Math.min(minViprRating,currentViprRating);
        maxViprRating = Math.max(maxViprRating,currentViprRating);

        let playerRatingBefore = gr[playerLabel + "_rating_before"];
        let partnerRatingBefore = gr[partnerLabel + "_rating_before"];
        let otherTeamPlayer1Before = gr[otherTeamLabel + "1_rating_before"]
        let otherTeamPlayer2Before = gr[otherTeamLabel + "2_rating_before"]

        let playerRatingAfter = gr[playerLabel + "_rating_after"];
        let partnerRatingAfter = gr[partnerLabel + "_rating_after"];
        let otherTeamPlayer1After = gr[otherTeamLabel + "1_rating_after"]
        let otherTeamPlayer2After = gr[otherTeamLabel + "2_rating_after"]

        let playerTeamCombinedRating = combined_rating(playerRatingBefore,partnerRatingBefore, gr.meta.crf);
        let oppositionTeamCombinedRating = combined_rating(otherTeamPlayer1Before,otherTeamPlayer2Before, gr.meta.crf);
        let playerTeamCombinedDeltaRating = playerTeamCombinedRating - oppositionTeamCombinedRating;

        // Save playerTeamCombinedDeltaRating into game result
        // Sneaky way to cashe for "best" and "Worst" loops
        gr["playerTeamCombinedDeltaRating"] = playerTeamCombinedDeltaRating;

        accumulatedDeltaViprRating += playerTeamCombinedDeltaRating;
        minDeltaViprRating = Math.min(minDeltaViprRating,playerTeamCombinedDeltaRating);
        maxDeltaViprRating = Math.max(maxDeltaViprRating,playerTeamCombinedDeltaRating);

        let changeInR = gr[playerLabel + "_rating_after"] - gr[playerLabel + "_rating_before"]
        
// Create and save one game results
resultsText.push(`
<div class="results-game-info">Date: ${gr.match_date} Match: ${gr.match_id.slice(-4)} Game: ${gr.game_number}</div>
<div class="results-container">
  <div class="results-header" style="text-align: right">Player: </div>
  <div class="results-header">Before</div>
  <div class="results-header">Team&nbsp;&Delta;&nbsp;R</div>
  <div class="results-header">Score</div>
  <div class="results-header">After</div>

  <div class="results-names" style="text-align: right">${playerName}</div>
  <div class="results-rating">${playerRatingBefore.toFixed(3)}</div>
  <div class="results-cr-delta">${formatSigned(playerTeamCombinedDeltaRating)}</div>
  <div class="results-scores">${gr[teamLabel+"_points"]}</div>
  <div class="results-rating">${playerRatingAfter.toFixed(3)}</div>

  <div class="results-names" style="text-align: right">${gr[partnerLabel + "_name"]}</div>
  <div class="results-rating">${partnerRatingBefore.toFixed(3)}</div>
  <div></div>
  <div></div>
  <div class="results-rating">${partnerRatingAfter.toFixed(3)}</div>

  <div class="results-names" style="text-align: right">${gr[otherTeamLabel + "1_name"]}</div>
  <div class="results-rating">${otherTeamPlayer1Before.toFixed(3)}}</div>
  <div class="results-cr-delta">${formatSigned(-playerTeamCombinedDeltaRating)}</div>
  <div class="results-scores">${gr[otherTeamLabel+"_points"]}</div>
  <div class="results-rating">${otherTeamPlayer1After.toFixed(3)}</div>

  <div class="results-names" style="text-align: right">${gr[otherTeamLabel + "2_name"]}</div>
  <div class="results-rating">${otherTeamPlayer2Before.toFixed(3)}}</div>
  <div></div>
  <div></div>
  <div class="results-rating">${otherTeamPlayer2After.toFixed(3)}</div>

</div>`);

      }
  })

  let gamesTied = totalGames - gamesWon - gamesLost;

  // Create best game highlight message
  let bestGameMessage;
  let bestMinPlayerTeamCombinedRating = Number.MAX_SAFE_INTEGER;

  if (gamesWon > 0) {
    // Loop through all games to find the best result (win with lowest delta rating)
    gameResults.forEach((gr) => {

      // Figure out labels for Best game
      let bestPlayerLabel = GetPlayerLabel(player_uid, gr);

      // Did selected player participate in this game?
      if (bestPlayerLabel) {
        let bestTeamLabel = bestPlayerLabel.substring(0, bestPlayerLabel.length-1);
        let bestPartnerLabel = GetPartnerLabel(bestTeamLabel,bestPlayerLabel);
        let bestOtherTeamLabel = (bestTeamLabel == "home") ? "visitor" : "home";

        // Only create best game message if player won and combined rating delta is lowest
        if ((gr.winner == bestTeamLabel) && (gr["playerTeamCombinedDeltaRating"] <= bestMinPlayerTeamCombinedRating)) {
          bestGameMessage = `On ${gr.match_date} ${playerName} and ${gr[bestPartnerLabel + "_name"]} beat ${gr[bestOtherTeamLabel + "1_name"]} and ${gr[bestOtherTeamLabel + "2_name"]}`;
          bestGameMessage += ` ${gr[bestTeamLabel+"_points"]}-${gr[bestOtherTeamLabel+"_points"]} with a difference in team combined VIPR rating of ${formatSigned(gr["playerTeamCombinedDeltaRating"])})`;
          bestMinPlayerTeamCombinedRating = gr["playerTeamCombinedDeltaRating"];
        }
      }
    });
  
  } else {
    bestGameMessage = `${playerName} didn't win any games`
  }

  // Create worst game lowlight message
  let worstGameMessage;
  let worstMaxPlayerTeamCombinedRating = Number.MIN_SAFE_INTEGER;

  if (gamesLost > 0) {
    // Loop through all games to find the best result (win with lowest delta rating)
    gameResults.forEach((gr) => {

      // Figure out labels for Worst game
      let worstPlayerLabel = GetPlayerLabel(player_uid, gr);
      if (worstPlayerLabel) {
        let worstTeamLabel = worstPlayerLabel.substring(0, worstPlayerLabel.length-1);
        let worstPartnerLabel = GetPartnerLabel(worstTeamLabel,worstPlayerLabel);
        let worstOtherTeamLabel = (worstTeamLabel == "home") ? "visitor" : "home";

        // Only create worst game message if player lost and combined rating delta is highest
        if ((gr.loser == worstTeamLabel) && (gr["playerTeamCombinedDeltaRating"] >= worstMaxPlayerTeamCombinedRating)) {
          worstGameMessage = `On ${gr.match_date} ${playerName} and ${gr[worstPartnerLabel + "_name"]} lost to ${gr[worstOtherTeamLabel + "1_name"]} and ${gr[worstOtherTeamLabel + "2_name"]}`;
          worstGameMessage += ` ${gr[worstTeamLabel+"_points"]}-${gr[worstOtherTeamLabel+"_points"]} with a difference in team combined VIPR rating of ${formatSigned(gr["playerTeamCombinedDeltaRating"])}`;
          worstMaxPlayerTeamCombinedRating = gr["playerTeamCombinedDeltaRating"];
        }
      }
    });

  } else {
  worstGameMessage = `${playerName} didn't lose any games`
}

// Deal with no results for selected player (e.g when blank line is the selected player or when uid passed in query string)
if (player_uid == "") {
  // let innerHTML = `<div class="page">
  // <div class="title">The selected player has not played a game in ${leagueName}</div>`
  document.getElementById("stats-holder").innerHTML = "";
  return;
}

// Create stats HTML
  let innerHTML = `
<div class="page">
<!-- Stats table -->
<div class="sub-title">Statistics (VIPR)</div>

<div class="card stats-container">
  <div class="stats-description">Total games played</div><div class="stats-value">${totalGames}</div>
  <div class="stats-description">Games won</div><div class="stats-value">${gamesWon}</div>
  <div class="stats-description">Games lost</div><div class="stats-value">${gamesLost}</div>
  <div class="stats-description">Games tied</div><div class="stats-value">${gamesTied}</div>
  <div class="stats-description">Total points for</div><div class="stats-value">${totalPointsFor}</div>
  <div class="stats-description">Total points against</div><div class="stats-value">${totalPointsAgainst}</div>
  <div class="stats-description">Current VIPR rating</div><div class="stats-value">${currentViprRating.toFixed(3)}</div>
  <div class="stats-description">Min VIPR rating</div><div class="stats-value">${minViprRating.toFixed(3)}</div>
  <div class="stats-description">Max VIPR rating</div><div class="stats-value">${maxViprRating.toFixed(3)}</div>
  <div class="stats-description">Average VIPR rating</div><div class="stats-value">${(accumulatedViprRating / totalGames).toFixed(3)}</div>
  <div class="stats-description">Min team VIPR rating delta</div><div class="stats-value">${formatSigned(minDeltaViprRating)}</div>
  <div class="stats-description">Max team VIPR rating delta</div><div class="stats-value">${formatSigned(maxDeltaViprRating)}</div>
  <div class="stats-description">Average team VIPR rating delta</div><div class="stats-value">${formatSigned(accumulatedDeltaViprRating / totalGames)}</div>
  <div class="stats-description">Longest winning streak</div><div class="stats-value">${maxWinStreak}</div>
  <div class="stats-description">Longest losing streak</div><div class="stats-value">${maxLossStreak}</div>
</div>

<!-- Hilite and lolite -->
<div class="sub-title">Highlights and Lowlights (VIPR)</div>
<div class="card">
  <div class="highlight-label">Best Game:</div>
  <div class="highlight-message">${bestGameMessage}</div>
  <div class="highlight-label">Worst Game:</div>
  <div class="highlight-message">${worstGameMessage}</div>
</div>
</div>
`;

let resultHTMLHeader = `  <div class="sub-title">Game Results (VIPR)</div>`;

for (let i=0; i<resultsText.length; i++) {
  resultHTMLHeader += resultsText[i];
}

innerHTML = innerHTML + resultHTMLHeader;

document.getElementById("stats-holder").innerHTML = innerHTML;

}

function GetPlayerLabel(player_uid, gr) {

  if (gr.visitor1_uid == player_uid) return "visitor1";
  if (gr.visitor2_uid == player_uid) return "visitor2";
  if (gr.home1_uid == player_uid) return "home1";
  if (gr.home2_uid == player_uid)  return "home2";

  return null;
}

function GetPartnerLabel(teamLabel,playerLabel) {
  if (teamLabel == "home"){
    return (playerLabel == "home1") ? "home2" : "home1";
  } else {
    return (playerLabel == "visitor1") ? "visitor2" : "visitor1";
  }


}

function combined_rating(rating_p1, rating_p2, crf) {
    let ave_rating = (rating_p1 + rating_p2) / 2.0;
    return ave_rating - (ave_rating - Math.min(rating_p1, rating_p2)) * crf / 100.0;
}

// Check that a query string parameter is valid (not null, undefined or empty)
function isParamValid(param) {
    return param !== null && param !== undefined && param !== "";
}

// Force a + in front of numbers > 0
function formatSigned(n) {
    const sign = n < 0 ? "" : "+";
    return sign + n.toFixed(3);
}

"use strict";
const version = " V0.1";
var player_uid;

async function handleOnLoad() {

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

    let maxLossStreak = Number.MIN_SAFE_INTEGER;
    let maxWinStreak = Number.MIN_SAFE_INTEGER;

    // Game results variables
    let resultsText = [];

    // Read query string parameters
    const params = new URLSearchParams(window.location.search);
    let league = params.get('league'); // mens or pyp
    
    if (!isParamValid(league)) {
        league = "mens";
    }

    // Get player uid and if no valid uid passed in query string use Mike for mens and Jim for pyp
    player_uid = params.get("uid");
    if (!isParamValid(player_uid)) {
        player_uid = (league == "mens") ? "49d40ef4a000349ccbc15c5e" : "c459812410f5cd9bda326c26"; // "6f5fa0b8cb58111847cb83c4"
    }
    // Use sanitized data if no password
    let resultsFilename;
    const hash = params.get('hash'); // Hash of top secret password
    if (isParamValid(hash)) {
        resultsFilename = `${hash}_${league}.json`;
    } else {
        resultsFilename = `ViprAlgoResults_${league}_sanitized.json`;
    }

    const leagueName = (league == "mens") ? "Men's League" : "Mixed PYP League"; // Change to object

    // Real code will just gets back match results for selected player but for now extract it from all data
    // First read the results document (players names, before and after ratings etc.)
    const response = await fetch(`data/${resultsFilename}`);
    const textResults = await response.text();
    const gameResults = JSON.parse(textResults);
    
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

          let playerTeamCombinedRating = combined_rating(playerRatingBefore,partnerRatingBefore, gr.meta.crf);
          let oppositionTeamCombinedRating = combined_rating(otherTeamPlayer1Before,otherTeamPlayer2Before, gr.meta.crf);
          let playerTeamCombinedDeltaRating = playerTeamCombinedRating - oppositionTeamCombinedRating

          // Save playerTeamCombinedDeltaRating into game result
          gr["playerTeamCombinedDeltaRating"] = playerTeamCombinedDeltaRating;

          accumulatedDeltaViprRating += playerTeamCombinedDeltaRating;
          minDeltaViprRating = Math.min(minDeltaViprRating,playerTeamCombinedDeltaRating);
          maxDeltaViprRating = Math.max(maxDeltaViprRating,playerTeamCombinedDeltaRating);

          let changeInR = gr[playerLabel + "_rating_after"] - gr[playerLabel + "_rating_before"]
          
  // Create and save one game results
  resultsText.push(`
  <div class="results-game-info">Date: ${gr.match_date} Match: ${gr.match_id.slice(-4)} Game: ${gr.game_number}</div>
  <div class="results-container">
    <div class="results-header" style="text-align: right">Players (VIPR): </div>
    <div class="results-header">Team&nbsp;&Delta;&nbsp;R</div>
    <div class="results-header">Score</div>
    <div class="results-header">R&nbsp;Change</div>
    <div class="results-names" style="text-align: right">You (${playerRatingBefore.toFixed(3)}) / ${gr[partnerLabel + "_name"]} (${partnerRatingBefore.toFixed(3)}):&nbsp;</div>
    <div class="results-cr-delta">${formatSigned(playerTeamCombinedDeltaRating)}</div>
    <div class="results-scores">${gr[teamLabel+"_points"]}</div>
    <div class="results-scores">${formatSigned(changeInR)}</div>
    <div class="results-names" style="text-align: right">${gr[otherTeamLabel + "1_name"]} (${otherTeamPlayer1Before.toFixed(3)}) / ${gr[otherTeamLabel + "2_name"]} (${otherTeamPlayer2Before.toFixed(3)}):&nbsp;</div>
    <div class="results-cr-delta">${formatSigned(-playerTeamCombinedDeltaRating)}</div>
    <div class="results-scores">${gr[otherTeamLabel+"_points"]}</div>
    <div class="results-scores">${formatSigned(-changeInR)}</div>
  </div>`);

        }
    })

    let gamesTied = totalGames - gamesWon - gamesLost;

    // Create best game and worst game highlight messages
    let bestGameMessage;
    let bestMinPlayerTeamCombinedRating = Number.MAX_SAFE_INTEGER;
    let worstGameMessage;
    let worstMaxPlayerTeamCombinedRating = Number.MIN_SAFE_INTEGER;

    if (gamesWon > 0) {
      // Loop through all games to find the best result (win with lowest delta rating)
      gameResults.forEach((gr) => {

        // Figure out labels for Best game
        let bestPlayerLabel = GetPlayerLabel(player_uid, gr);
        if (bestPlayerLabel) {
          let bestTeamLabel = bestPlayerLabel.substring(0, bestPlayerLabel.length-1);
          let bestPartnerLabel = GetPartnerLabel(bestTeamLabel,bestPlayerLabel);
          let bestOtherTeamLabel = (bestTeamLabel == "home") ? "visitor" : "home";

          // Only create best game message if player won and combined rating delta is lowest
          if ((gr.winner == bestTeamLabel) && (gr["playerTeamCombinedDeltaRating"] <= bestMinPlayerTeamCombinedRating)) {
            bestGameMessage = `On ${gr.match_date} you and ${gr[bestPartnerLabel + "_name"]} beat ${gr[bestOtherTeamLabel + "1_name"]} and ${gr[bestOtherTeamLabel + "2_name"]}`;
            bestGameMessage += ` ${gr[bestTeamLabel+"_points"]}-${gr[bestOtherTeamLabel+"_points"]} with a difference in team combined VIPR rating of ${formatSigned(gr["playerTeamCombinedDeltaRating"])}`;
            bestMinPlayerTeamCombinedRating = gr["playerTeamCombinedDeltaRating"];
          }
        }
      });
    
    } else {
      bestGameMessage = "You didn't win any games"
    }

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
            worstGameMessage = `On ${gr.match_date} you and ${gr[worstPartnerLabel + "_name"]} lost to ${gr[worstOtherTeamLabel + "1_name"]} and ${gr[worstOtherTeamLabel + "2_name"]}`;
            worstGameMessage += ` ${gr[worstTeamLabel+"_points"]}-${gr[worstOtherTeamLabel+"_points"]} with a difference in team combined VIPR rating of ${formatSigned(gr["playerTeamCombinedDeltaRating"])}`;
            worstMaxPlayerTeamCombinedRating = gr["playerTeamCombinedDeltaRating"];
          }
        }
      });

    } else {
    worstGameMessage = "You didn't lose any games"
  }

  // Deal with no results for selected player
  if (playerName == "") {
    let innerHTML = `<div class="page">
    <div class="title">The selected player has not played a game in ${leagueName}</div>`
    document.getElementById("body").innerHTML = innerHTML;
    return;
  }

  // Create stats HTML
    let innerHTML = `
<div class="page">
  <div class="title">${leagueName}: ${playerName}</div>
  <!-- Stats table -->
  <div class="sub-title">Statistics</div>

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
  <div class="sub-title">Highlights and Lowlights</div>
  <div class="card">
    <div class="highlight-label">Best Game:</div>
    <div class="highlight-message">${bestGameMessage}</div>
    <div class="highlight-label">Worst Game:</div>
    <div class="highlight-message">${worstGameMessage}</div>
  </div>
</div>
`;

let resultHTMLHeader = `  <div class="sub-title">Game Results</div>`;

  for (let i=0; i<resultsText.length; i++) {
    resultHTMLHeader += resultsText[i];
  }

  innerHTML = innerHTML + resultHTMLHeader;

document.getElementById("body").innerHTML = innerHTML;


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

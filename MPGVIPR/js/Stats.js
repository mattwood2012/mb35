function handleOnLoad() {

    let totalGames = 20;
    let gamesWon = 14;
    let gamesLost = 4;
    let gamesTied = totalGames - gamesWon - gamesLost;

    let totalPointsFor = 123;
    let totalPointsAgainst = 321;

    let currentViprRating = 4.111;
    let minViprRating = 4.123;
    let maxViprRating = 4.321;
    let averageViprRating = 4.222;

    let innerHTML = `<h2>Statistics for Player 17</h2>

<div class="container">
  <div class="stats-description">Total games played</div>
  <div class="stats-value">${totalGames}</div>

  <div class="stats-description">Games won</div>
  <div class="stats-value">${gamesWon}</div>

  <div class="stats-description">Games lost</div>
  <div class="stats-value">${gamesLost}</div>

  <div class="stats-description">Games tied</div>
  <div class="stats-value">${gamesTied}</div>

  <div class="stats-description">Total points for</div>
  <div class="stats-value">${totalPointsFor}</div>

  <div class="stats-description">Total points against</div>
  <div class="stats-value">${totalPointsAgainst}</div>

  <div class="stats-description">Current VIPR rating</div>
  <div class="stats-value">${currentViprRating}</div>

  <div class="stats-description">Min VIPR rating</div>
  <div class="stats-value">${minViprRating}</div>

  <div class="stats-description">Max VIPR rating</div>
  <div class="stats-value">${maxViprRating}</div>

  <div class="stats-description">Average VIPR rating</div>
  <div class="stats-value">${averageViprRating}</div>

</div>`;


document.getElementById("body").innerHTML = innerHTML;


}

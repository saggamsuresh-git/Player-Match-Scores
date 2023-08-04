const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertAllPlayers = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
//API 1 Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT
      *
    FROM
      player_details`;
  const playersArray = await db.all(getAllPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertAllPlayers(eachPlayer))
  );
});

//API 2 Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT
    *
  FROM
    player_details
  WHERE
    player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertAllPlayers(player));
});

//API 3 Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET 
    player_name = '${playerName}'
  WHERE 
    player_id = ${playerId};`;
  const updatedPlayer = await db.run(updatePlayerQuery);
  //   response.send(updatedPlayer);
  response.send("Player Details Updated");
});

const matchConverter = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//API 4 Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
  SELECT
    * 
  FROM
    match_details
  WHERE
    match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(matchConverter(match));
});

//API 5 Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `
  SELECT
    *
  FROM
    player_match_score NATURAL JOIN match_details
  WHERE
    player_id = ${playerId};`;
  const matchesArray = await db.all(getMatchesOfPlayerQuery);
  response.send(matchesArray.map((eachMatch) => matchConverter(eachMatch)));
});

const playerMatchScores = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
//API 6 Returns a list of players of a specific match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const playersOfSpecificMatchesQuery = `
  SELECT
    *
  FROM
    player_match_score NATURAL JOIN match_details as T NATURAL JOIN player_details
  WHERE
    match_id = ${matchId};`;
  const matchesPlayers = await db.all(playersOfSpecificMatchesQuery);
  response.send(
    matchesPlayers.map((eachPlayersMatch) =>
      playerMatchScores(eachPlayersMatch)
    )
  );
});

///
//
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
  SELECT
    player_name,player_id, SUM(score) as score, SUM(fours) as fours, SUM(sixes) as sixes
  FROM
    player_details NATURAL JOIN player_match_score
  WHERE 
    player_id = ${playerId};
  `;
  const playerStats = await db.get(getPlayerStatsQuery);
  response.send({
    playerId: playerStats.player_id,
    playerName: playerStats.player_name,
    totalScore: playerStats.score,
    totalFours: playerStats.fours,
    totalSixes: playerStats.sixes,
  });
});

module.exports = app;

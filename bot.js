const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const fetch = require("node-fetch");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const IF_API_KEY = process.env.IF_API_KEY;

const pilots = [
 "Arendiuz",
 "FreshOuttaPoland",
 "United403",
 "Dub-aviation",
 "Iggi_Mohrer",
 "DanilVL",
 "Westjet1515",
 "HRTORONTO22",
 "matis_dn",
 "cptnsafa",
 "Aiden_Hodges",
 "G-OJON"
];

const client = new Client({
 intents: [GatewayIntentBits.Guilds]
});

const commands = [

 new SlashCommandBuilder()
  .setName("vaflight")
  .setDescription("Show Luxair Virtual flights currently online"),

 new SlashCommandBuilder()
  .setName("vaonline")
  .setDescription("Number of Luxair Virtual pilots currently flying"),

 new SlashCommandBuilder()
  .setName("vapilots")
  .setDescription("List Luxair Virtual pilots currently flying")

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

async function registerCommands() {
 await rest.put(
  Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
  { body: commands }
 );
}

registerCommands();

client.once("ready", () => {
 console.log(`Bot ready: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {

 if (!interaction.isChatInputCommand()) return;

 try {

  // ===== SERVERS =====
  const sessionsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions?apikey=${IF_API_KEY}`);
  const sessionsData = await sessionsRes.json();
  const expertServer = sessionsData.result.find(s => s.worldType === 3);

  // ===== FLIGHTS =====
  const flightsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions/${expertServer.id}/flights?apikey=${IF_API_KEY}`);
  const flightsData = await flightsRes.json();
  const flights = flightsData.result;

  // ===== AIRCRAFT LIST =====
  const aircraftRes = await fetch(`https://api.infiniteflight.com/public/v2/aircraft?apikey=${IF_API_KEY}`);
  const aircraftData = await aircraftRes.json();

  const vaFlights = flights.filter(f => pilots.includes(f.username));

  // =========================
  // /vaonline
  // =========================

  if (interaction.commandName === "vaonline") {

   return interaction.reply(
`Luxair Virtual Status (Expert Server)

Pilots Online: ${vaFlights.length}`
   );

  }

  // =========================
  // /vapilots
  // =========================

  if (interaction.commandName === "vapilots") {

   if (vaFlights.length === 0) {
    return interaction.reply("No Luxair Virtual pilots currently flying.");
   }

   let output = "Luxair Virtual Pilots Online (Expert Server)\n\n";

   vaFlights.forEach(f => {
    output += `${f.callsign}\n`;
   });

   return interaction.reply(output);

  }

  // =========================
  // /vaflight
  // =========================

if (interaction.commandName === "vaflight") {

 if (vaFlights.length === 0) {
  return interaction.reply("No Luxair Virtual pilots currently flying on Expert Server.");
 }

 let output = "Luxair Virtual Flights (Expert Server)\n\n";

 for (const flight of vaFlights) {

  // ROUTE (plus robuste)
  const dep =
   flight.flightPlan?.departureAirportId ||
   flight.departureAirportId ||
   "Unknown";

  const arr =
   flight.flightPlan?.destinationAirportId ||
   flight.destinationAirportId ||
   "Unknown";

  // SPEED (corrige NaN)
  const speed = Math.round(
   flight.groundSpeed ||
   flight.speed ||
   0
  );

  // ALTITUDE
  const altitude = Math.round(flight.altitude || 0);

  // FLIGHT TIME
  const time = Math.floor((flight.flightTime || 0) / 60);

  // AIRCRAFT
  const aircraftObj = aircraftData.result.find(a => a.id === flight.aircraftId);
  const aircraft = aircraftObj ? aircraftObj.name : "Unknown";

  // LIVERY
  let livery = "Unknown";

  if (aircraftObj) {

   const liveryRes = await fetch(
    `https://api.infiniteflight.com/public/v2/aircraft/${flight.aircraftId}/liveries?apikey=${IF_API_KEY}`
   );

   const liveryData = await liveryRes.json();

   const liveryObj = liveryData.result.find(l => l.id === flight.liveryId);

   if (liveryObj) livery = liveryObj.liveryName;
  }

  output += `✈ ${flight.callsign}\n`;
  output += `Route: ${dep} → ${arr}\n`;
  output += `Aircraft: ${aircraft}\n`;
  output += `Livery: ${livery}\n`;
  output += `Altitude: ${altitude} ft\n`;
  output += `Speed: ${speed} kts\n`;
  output += `Flight Time: ${time} min\n\n`;

 }

 return interaction.reply(output);
}

 } catch (err) {

  console.error(err);
  interaction.reply("Error retrieving flights.");

 }

});

client.login(DISCORD_TOKEN);

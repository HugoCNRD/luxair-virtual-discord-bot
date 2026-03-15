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

 await interaction.deferReply();

 try {

  // SERVERS
  const sessionsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions?apikey=${IF_API_KEY}`);
  const sessionsData = await sessionsRes.json();

  const expertServer = sessionsData.result.find(s => s.worldType === 3);

  // FLIGHTS
  const flightsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions/${expertServer.id}/flights?apikey=${IF_API_KEY}`);
  const flightsData = await flightsRes.json();

  const flights = flightsData.result;

  const vaFlights = flights.filter(f => pilots.includes(f.username));

  // =====================
  // /vaonline
  // =====================

  if (interaction.commandName === "vaonline") {

   return interaction.editReply(
`Luxair Virtual Status (Expert Server)

Pilots Online: ${vaFlights.length}`
   );

  }

  // =====================
  // /vapilots
  // =====================

  if (interaction.commandName === "vapilots") {

   if (vaFlights.length === 0) {
    return interaction.editReply("No Luxair Virtual pilots currently flying.");
   }

   let output = "Luxair Virtual Pilots Online (Expert Server)\n\n";

   vaFlights.forEach(f => {
    output += `${f.callsign}\n`;
   });

   return interaction.editReply(output);

  }

  // =====================
  // /vaflight
  // =====================

  if (interaction.commandName === "vaflight") {

   if (vaFlights.length === 0) {
    return interaction.editReply("No Luxair Virtual pilots currently flying on Expert Server.");
   }

   let output = "Luxair Virtual Flights (Expert Server)\n\n";

   vaFlights.forEach(flight => {

    const dep = flight.flightPlan?.departureAirportId || "N/A";
    const arr = flight.flightPlan?.destinationAirportId || "N/A";

    const altitude = Math.round(flight.altitude);
    const speed = Math.round(flight.groundSpeed);

    output += `✈ ${flight.callsign}\n`;
    output += `Route: ${dep} → ${arr}\n`;
    output += `Altitude: ${altitude} ft\n`;
    output += `Speed: ${speed} kts\n\n`;

   });

   return interaction.editReply(output);

  }

 } catch (err) {

  console.error(err);
  interaction.editReply("Error retrieving flights.");

 }

});

client.login(DISCORD_TOKEN);

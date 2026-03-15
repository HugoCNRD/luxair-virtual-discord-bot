const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const fetch = require("node-fetch");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const IF_API_KEY = process.env.IF_API_KEY;

// Pilotes VA
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

// Discord client
const client = new Client({
 intents: [GatewayIntentBits.Guilds]
});

// Slash command
const commands = [
 new SlashCommandBuilder()
  .setName("vaflight")
  .setDescription("Show VA flights currently online")
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

// Register slash command
async function registerCommands() {
 try {
  await rest.put(
   Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
   { body: commands }
  );
  console.log("Slash command registered");
 } catch (err) {
  console.error("Command registration error:", err);
 }
}

registerCommands();

client.once("ready", () => {
 console.log(`Bot ready: ${client.user.tag}`);
});

// Interaction handler
client.on("interactionCreate", async interaction => {

 if (!interaction.isChatInputCommand()) return;

 if (interaction.commandName === "vaflight") {

  await interaction.deferReply();

  try {

   // Get sessions
   const sessionsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions?apikey=${IF_API_KEY}`);
   const sessionsData = await sessionsRes.json();

   const expertServer = sessionsData.result.find(s => s.worldType === 3);

   if (!expertServer) {
    return interaction.editReply("Expert server not found.");
   }

   // Get flights
   const flightsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions/${expertServer.id}/flights?apikey=${IF_API_KEY}`);
   const flightsData = await flightsRes.json();
   const flights = flightsData.result;

   // Get aircraft list
   const aircraftRes = await fetch(`https://api.infiniteflight.com/public/v2/aircraft?apikey=${IF_API_KEY}`);
   const aircraftData = await aircraftRes.json();

   // Get liveries
   const liveriesRes = await fetch(`https://api.infiniteflight.com/public/v2/aircraft/liveries?apikey=${IF_API_KEY}`);
   const liveriesData = await liveriesRes.json();

   let output = "";

   flights.forEach(flight => {

    if (pilots.includes(flight.username)) {

     const callsign = flight.callsign || "N/A";

     const dep = flight.flightPlan?.departureAirportId || "N/A";
     const arr = flight.flightPlan?.destinationAirportId || "N/A";

     const aircraft = aircraftData.result.find(a => a.id === flight.aircraftId)?.name || "Unknown";

     const livery = liveriesData.result.find(l => l.id === flight.liveryId)?.name || "Unknown";

     output += `✈ **${callsign}**\n`;
     output += `Route: ${dep} → ${arr}\n`;
     output += `Aircraft: ${aircraft}\n`;
     output += `Livery: ${livery}\n\n`;

    }

   });

   if (output === "") {
    output = "No Luxair Virtual pilots currently flying.";
   }

   await interaction.editReply(output);

  } catch (err) {

   console.error("Flight retrieval error:", err);
   await interaction.editReply("Error retrieving flights from Infinite Flight API.");

  }

 }

});

client.login(DISCORD_TOKEN);

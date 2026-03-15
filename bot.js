const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const fetch = require("node-fetch");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const IF_API_KEY = process.env.IF_API_KEY;

// Liste pilotes VA
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
  .setDescription("Show VA flights currently online")
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

 if (interaction.commandName === "vaflight") {

  await interaction.deferReply();

  try {

   // 1️⃣ sessions
   const sessionsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions?apikey=${IF_API_KEY}`);
   const sessionsData = await sessionsRes.json();

   const expertServer = sessionsData.result.find(s => s.worldType === 3);

   // 2️⃣ flights
   const flightsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions/${expertServer.id}/flights?apikey=${IF_API_KEY}`);
   const flightsData = await flightsRes.json();

   const flights = flightsData.result;

   // 3️⃣ aircraft list
   const aircraftRes = await fetch(`https://api.infiniteflight.com/public/v2/aircraft?apikey=${IF_API_KEY}`);
   const aircraftData = await aircraftRes.json();

   let output = "";

   for (const flight of flights) {

    if (!pilots.includes(flight.username)) continue;

    const callsign = flight.callsign || "N/A";

    // ROUTE
    const dep =
     flight.flightPlan?.departureAirportId ||
     flight.departureAirportId ||
     "N/A";

    const arr =
     flight.flightPlan?.destinationAirportId ||
     flight.destinationAirportId ||
     "N/A";

    // AIRCRAFT
    const aircraftObj = aircraftData.result.find(a => a.id === flight.aircraftId);
    const aircraft = aircraftObj?.name || "Unknown";

    // LIVERY
    let livery = "Unknown";

    if (aircraftObj) {

     const liveryRes = await fetch(
      `https://api.infiniteflight.com/public/v2/aircraft/${flight.aircraftId}/liveries?apikey=${IF_API_KEY}`
     );

     const liveryData = await liveryRes.json();

     const liveryObj = liveryData.result.find(l => l.id === flight.liveryId);

     if (liveryObj) {
      livery = liveryObj.name;
     }
    }

    output += `✈ **${callsign}**\n`;
    output += `Route: ${dep} → ${arr}\n`;
    output += `Aircraft: ${aircraft}\n`;
    output += `Livery: ${livery}\n\n`;

   }

   if (output === "") {
    output = "No Luxair Virtual pilots currently flying.";
   }

   await interaction.editReply(output);

  } catch (err) {

   console.error(err);
   await interaction.editReply("Error retrieving flights.");

  }

 }

});

client.login(DISCORD_TOKEN);

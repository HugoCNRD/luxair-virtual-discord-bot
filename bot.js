const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const fetch = require("node-fetch");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const IF_API_KEY = process.env.IF_API_KEY;

// Liste des pilotes VA
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
 "G-OJON",
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

   const sessionsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions?apikey=${IF_API_KEY}`);
   const sessions = await sessionsRes.json();

   const expertServer = sessions.result.find(s => s.name === "Expert");

   const flightsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions/${expertServer.id}/flights?apikey=${IF_API_KEY}`);
   const flightsData = await flightsRes.json();

   const flights = flightsData.result;

   let output = "";

   flights.forEach(flight => {

    if (pilots.includes(flight.username)) {

     const dep = flight.flightPlan?.departureAirportId || "N/A";
     const arr = flight.flightPlan?.arrivalAirportId || "N/A";
     const callsign = flight.callsign || "N/A";

     const time = Math.floor(flight.flightTime / 60);

     output += `✈ **${callsign}**\n`;
     output += `Departure: ${dep}\n`;
     output += `Arrival: ${arr}\n`;
     output += `Flight Time: ${time} min\n\n`;

    }

   });

   if (output === "") {
    output = "No VA pilots currently flying.";
   }

   await interaction.editReply(output);

  } catch (err) {

   console.error(err);
   await interaction.editReply("Error retrieving flights.");

  }

 }

});

client.login(DISCORD_TOKEN);

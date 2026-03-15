const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, EmbedBuilder } = require("discord.js");
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
  .setDescription("Show number of Luxair Virtual pilots currently flying")

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

  // GET SERVERS
  const sessionsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions?apikey=${IF_API_KEY}`);
  const sessionsData = await sessionsRes.json();
  const expertServer = sessionsData.result.find(s => s.worldType === 3);

  // GET FLIGHTS
  const flightsRes = await fetch(`https://api.infiniteflight.com/public/v2/sessions/${expertServer.id}/flights?apikey=${IF_API_KEY}`);
  const flightsData = await flightsRes.json();
  const flights = flightsData.result;

  const vaFlights = flights.filter(f => pilots.includes(f.username));

  // =========================
  // /vaonline
  // =========================

  if (interaction.commandName === "vaonline") {

   const embed = new EmbedBuilder()
    .setColor(0x00AEEF)
    .setTitle("Luxair Virtual Status")
    .setDescription("Current flights on **Expert Server**")
    .addFields(
     { name: "Pilots Online", value: `${vaFlights.length}`, inline: true }
    )
    .setFooter({ text: "Infinite Flight Live Data" });

   return interaction.reply({ embeds: [embed] });

  }

  // =========================
  // /vaflight
  // =========================

  if (interaction.commandName === "vaflight") {

   await interaction.deferReply();

   const aircraftRes = await fetch(`https://api.infiniteflight.com/public/v2/aircraft?apikey=${IF_API_KEY}`);
   const aircraftData = await aircraftRes.json();

   const embeds = [];

   for (const flight of vaFlights) {

    const dep = flight.flightPlan?.departureAirportId || "N/A";
    const arr = flight.flightPlan?.destinationAirportId || "N/A";

    const aircraftObj = aircraftData.result.find(a => a.id === flight.aircraftId);
    const aircraft = aircraftObj?.name || "Unknown";

    const altitude = Math.round(flight.altitude);
    const speed = Math.round(flight.groundSpeed);

    const embed = new EmbedBuilder()
     .setColor(0x00AEEF)
     .setTitle(`✈ ${flight.callsign}`)
     .setDescription(`Luxair Virtual Flight (Expert Server)`)
     .addFields(
      { name: "Route", value: `${dep} → ${arr}`, inline: false },
      { name: "Aircraft", value: aircraft, inline: true },
      { name: "Altitude", value: `${altitude} ft`, inline: true },
      { name: "Speed", value: `${speed} kts`, inline: true }
     );

    embeds.push(embed);

   }

   if (embeds.length === 0) {

    const embed = new EmbedBuilder()
     .setColor(0xff0000)
     .setTitle("Luxair Virtual Flights")
     .setDescription("No Luxair Virtual pilots currently flying on **Expert Server**.");

    return interaction.editReply({ embeds: [embed] });

   }

   return interaction.editReply({ embeds });

  }

 } catch (err) {

  console.error(err);

  if (interaction.deferred) {
   interaction.editReply("Error retrieving flights.");
  } else {
   interaction.reply("Error retrieving flights.");
  }

 }

});

client.login(DISCORD_TOKEN);

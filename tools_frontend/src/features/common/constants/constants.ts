import { GameMap, Awakening, Striker } from "@os-tools/shared/constants/common";

export { Team, DraftAction, GameMap, Awakening, Striker } from "@os-tools/shared/constants/common";
export { CURRENT_AWAKENING_POOL, AWAKENING_CONFLICTS } from "@os-tools/shared/constants/awakenings";
export { TIMER_SECONDS } from "@os-tools/shared/constants/timing";

export interface MapDefinition {
  name: string;
  image?: string;
  icon?: string;
  blurredImage?: string;
  variants?: MapDefinition[];
}

export const ALL_MAPS: MapDefinition[] = [
  {
    name: GameMap.AhtenCity,
    blurredImage: "/maps/Ahten_City_Blurred.png",
    image: "/maps/Ahten_City.png",
    icon: "/maps/Ahten_City_Icon.png",
  },
  {
    name: GameMap.AimisApp,
    blurredImage: "/maps/AiMis_App_Blurred.png",
    image: "/maps/AiMis_App.png",
    icon: "/maps/AiMis_App_Icon.png",
  },
  {
    name: GameMap.AtlasLab,
    blurredImage: "/maps/Atlas_Lab_Blurred.png",
    image: "/maps/Atlas_Lab.png",
    icon: "/maps/Atlas_Lab_Icon.png",
  },
  {
    name: GameMap.ClarionTestChamber,
    blurredImage: "/maps/Clarion_Test_Chamber_Blurred.png",
    image: "/maps/Clarion_Test_Chamber.png",
    icon: "/maps/Clarion_Test_Chamber_Icon.png",
    variants: [
      {
        name: "Bass Drop",
        image: "/maps/Clarion_Test_Chamber_Bass_Drop.png",
      },
      {
        name: "Expanse",
        image: "/maps/Clarion_Test_Chamber_Expanse.png",
      },
      {
        name: "Maelstrom",
        image: "/maps/Clarion_Test_Chamber_Maelstrom.png",
      },
      {
        name: "Obscura",
        image: "/maps/Clarion_Test_Chamber_Obscura.png",
      },
      {
        name: "Xeno",
        image: "/maps/Clarion_Test_Chamber_Xeno.png",
      },
    ],
  },
  {
    name: GameMap.DemonDais,
    blurredImage: "/maps/Demon_Dais_Blurred.png",
    image: "/maps/Demon_Dais.png",
    icon: "/maps/Demon_Dais_Icon.png",
  },
  {
    name: GameMap.GatesOfObscura,
    blurredImage: "/maps/Gates_of_Obscura_Blurred.png",
    image: "/maps/Gates_of_Obscura.png",
    icon: "/maps/Gates_of_Obscura_Icon.png",
  },
  {
    name: GameMap.InkysSplashZone,
    blurredImage: "/maps/Inkys_Splash_Zone_Blurred.png",
    image: "/maps/Inkys_Splash_Zone.png",
    icon: "/maps/Inkys_Splash_Zone_Icon.png",
  },
  {
    name: GameMap.NightMarket,
    blurredImage: "/maps/Night_Market_Blurred.png",
    image: "/maps/Night_Market.png",
    icon: "/maps/Night_Market_Icon.png",
  },
  {
    name: GameMap.OniVillage,
    blurredImage: "/maps/Oni_Village_Blurred.png",
    image: "/maps/Oni_Village.png",
    icon: "/maps/Oni_Village_Icon.png",
  },
  {
    name: GameMap.TaikoTemple,
    blurredImage: "/maps/Taiko_Temple_Blurred.png",
    image: "/maps/Taiko_Temple.png",
    icon: "/maps/Taiko_Temple_Icon.png",
  },
].sort((a, b) => a.name.localeCompare(b.name));

export const CURRENT_MAP_POOL = [
  GameMap.AhtenCity,
  GameMap.AimisApp,
  GameMap.AtlasLab,
  GameMap.ClarionTestChamber,
  GameMap.DemonDais,
  GameMap.GatesOfObscura,
  GameMap.InkysSplashZone,
];

export const ALL_AWAKENINGS = [
  { name: Awakening.AdrenalineRush, icon: "/awakenings/Adrenaline_Rush.png" },
  { name: Awakening.Aerials, icon: "/awakenings/Aerials.png" },
  { name: Awakening.AmongTitans, icon: "/awakenings/Among_Titans.png" },
  { name: Awakening.Berserker, icon: "/awakenings/Berserker.png" },
  { name: Awakening.BigFish, icon: "/awakenings/Big_Fish.png" },
  { name: Awakening.BuiltDifferent, icon: "/awakenings/Built_Different.png" },
  { name: Awakening.BulkUp, icon: "/awakenings/Bulk_Up.png" },
  { name: Awakening.CastToLast, icon: "/awakenings/Cast_to_Last.png" },
  { name: Awakening.Catalyst, icon: "/awakenings/Catalyst.png" },
  { name: Awakening.Chronoboost, icon: "/awakenings/Chronoboost.png" },
  { name: Awakening.Deadeye, icon: "/awakenings/Deadeye.png" },
  { name: Awakening.Demolitionist, icon: "/awakenings/Demolitionist.png" },
  { name: Awakening.Egoist, icon: "/awakenings/Egoist.png" },
  {
    name: Awakening.ExplosiveEntrance,
    icon: "/awakenings/Explosive_Entrance.png",
  },
  { name: Awakening.ExtraSpecial, icon: "/awakenings/Extra_Special.png" },
  { name: Awakening.FightOrFlight, icon: "/awakenings/Fight_or_Flight.png" },
  { name: Awakening.FireUp, icon: "/awakenings/Fire_Up!.png" },
  { name: Awakening.GlassCannon, icon: "/awakenings/Glass_Cannon.png" },
  { name: Awakening.HeavyHanded, icon: "/awakenings/Heavy_Handed.png" },
  { name: Awakening.HeavyImpact, icon: "/awakenings/Heavy_Impact.png" },
  { name: Awakening.Hotshot, icon: "/awakenings/Hotshot.png" },
  { name: Awakening.InnerFocus, icon: "/awakenings/Inner_Focus.png" },
  { name: Awakening.KnifesEdge, icon: "/awakenings/Knife's_Edge.png" },
  {
    name: Awakening.MightOfTheColossus,
    icon: "/awakenings/Might_of_the_Colossus.png",
  },
  {
    name: Awakening.MissilePropulsion,
    icon: "/awakenings/Missile_Propulsion.png",
  },
  { name: Awakening.Monumentalist, icon: "/awakenings/Monumentalist.png" },
  {
    name: Awakening.OmegaInfusedAccelerator,
    icon: "/awakenings/Omega_Infused_Accelerator.png",
  },
  { name: Awakening.OneTwoPunch, icon: "/awakenings/One-Two_Punch.png" },
  { name: Awakening.OrbDancer, icon: "/awakenings/Orb_Dancer.png" },
  { name: Awakening.OrbPonderer, icon: "/awakenings/Orb_Ponderer.png" },
  { name: Awakening.OrbReplicator, icon: "/awakenings/Orb_Replicator.png" },
  { name: Awakening.PeakPerformance, icon: "/awakenings/Peak_Performance.png" },
  { name: Awakening.PerfectForm, icon: "/awakenings/Perfect_Form.png" },
  { name: Awakening.Primetime, icon: "/awakenings/Primetime.png" },
  { name: Awakening.PrizeFighter, icon: "/awakenings/Prize_Fighter.png" },
  { name: Awakening.QuickReflexes, icon: "/awakenings/Quick_Reflexes.png" },
  { name: Awakening.QuickStrike, icon: "/awakenings/Quick_Strike.png" },
  { name: Awakening.Rampage, icon: "/awakenings/Rampage.png" },
  { name: Awakening.RapidFire, icon: "/awakenings/Rapid_Fire.png" },
  { name: Awakening.RecoveryDrone, icon: "/awakenings/Recovery_Drone.png" },
  { name: Awakening.ReptileRemedy, icon: "/awakenings/Reptile_Remedy.png" },
  { name: Awakening.Reverberation, icon: "/awakenings/Reverberation.png" },
  { name: Awakening.SiegeMachine, icon: "/awakenings/Siege_Machine.png" },
  { name: Awakening.SparkOfAgility, icon: "/awakenings/Spark_of_Agility.png" },
  { name: Awakening.SparkOfFocus, icon: "/awakenings/Spark_of_Focus.png" },
  {
    name: Awakening.SparkOfResilience,
    icon: "/awakenings/Spark_of_Resilience.png",
  },
  {
    name: Awakening.SparkOfStrength,
    icon: "/awakenings/Spark_of_Strength.png",
  },
  {
    name: Awakening.SparkOfLeadership,
    icon: "/awakenings/Spark_of_Leadership.png",
  },
  {
    name: Awakening.SpecializedTraining,
    icon: "/awakenings/Specialized_Training.png",
  },
  { name: Awakening.StacksOnStacks, icon: "/awakenings/Stacks_On_Stacks.png" },
  { name: Awakening.StaggerSwagger, icon: "/awakenings/Stagger_Swagger.png" },
  { name: Awakening.Stinger, icon: "/awakenings/Stinger.png" },
  { name: Awakening.SuperSurge, icon: "/awakenings/Super_Surge.png" },
  { name: Awakening.TeamPlayer, icon: "/awakenings/Team_Player.png" },
  { name: Awakening.TempoSwing, icon: "/awakenings/Tempo_Swing.png" },
  { name: Awakening.TimelessCreator, icon: "/awakenings/Timeless_Creator.png" },
  { name: Awakening.TwinDrive, icon: "/awakenings/Twin_Drive.png" },
  { name: Awakening.Unstoppable, icon: "/awakenings/Unstoppable.png" },
].sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_BANNED_AWAKENINGS = [Awakening.SparkOfLeadership, Awakening.TeamPlayer, Awakening.FireUp];

export enum StrikerDirection {
  Left = "left",
  Right = "right",
}

export const ALL_STRIKERS = [
  {
    name: Striker.AiMi,
    splash: "/strikers/Ai.Mi_splash.png",
    icon: "/strikers/Ai.Mi_icon.png",
    facing: StrikerDirection.Right,
  },
  {
    name: Striker.Asher,
    splash: "/strikers/Asher_splash.png",
    icon: "/strikers/Asher_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Atlas,
    splash: "/strikers/Atlas_splash.png",
    icon: "/strikers/Atlas_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Drekar,
    splash: "/strikers/Drek'ar_splash.png",
    icon: "/strikers/Drek'ar_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Dubu,
    splash: "/strikers/Dubu_splash.png",
    icon: "/strikers/Dubu_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Era,
    splash: "/strikers/Era_splash.png",
    icon: "/strikers/Era_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Estelle,
    splash: "/strikers/Estelle_splash.png",
    icon: "/strikers/Estelle_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Finii,
    splash: "/strikers/Finii_splash.png",
    icon: "/strikers/Finii_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Juliette,
    splash: "/strikers/Juliette_splash.png",
    icon: "/strikers/Juliette_icon.png",
    facing: StrikerDirection.Right,
  },
  {
    name: Striker.Juno,
    splash: "/strikers/Juno_splash.png",
    icon: "/strikers/Juno_icon.png",
    facing: StrikerDirection.Right,
  },
  {
    name: Striker.Kai,
    splash: "/strikers/Kai_splash.png",
    icon: "/strikers/Kai_icon.png",
    facing: StrikerDirection.Right,
  },
  {
    name: Striker.Kazan,
    splash: "/strikers/Kazan_splash.png",
    icon: "/strikers/Kazan_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Luna,
    splash: "/strikers/Luna_splash.png",
    icon: "/strikers/Luna_icon.png",
    facing: StrikerDirection.Right,
  },
  {
    name: Striker.Mako,
    splash: "/strikers/Mako_splash.png",
    icon: "/strikers/Mako_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Nao,
    splash: "/strikers/Nao_Splash.png",
    icon: "/strikers/Nao_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Octavia,
    splash: "/strikers/Octavia_splash.png",
    icon: "/strikers/Octavia_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Rasmus,
    splash: "/strikers/Rasmus_splash.png",
    icon: "/strikers/Rasmus_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Rune,
    splash: "/strikers/Rune_splash.png",
    icon: "/strikers/Rune_icon.png",
    facing: StrikerDirection.Right,
  },
  {
    name: Striker.Vyce,
    splash: "/strikers/Vyce_splash.png",
    icon: "/strikers/Vyce_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.X,
    splash: "/strikers/X_splash.png",
    icon: "/strikers/X_icon.png",
    facing: StrikerDirection.Left,
  },
  {
    name: Striker.Zentaro,
    splash: "/strikers/Zentaro_splash.png",
    icon: "/strikers/Zentaro_icon.png",
    facing: StrikerDirection.Left,
  },
].sort((a, b) => a.name.localeCompare(b.name));

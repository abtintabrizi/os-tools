import { Awakening, GameMap, Striker } from "@os-tools/shared";

export interface MapVariant {
  name: string;
  image?: string;
  icon?: string;
  blurredImage?: string;
}

export interface MapMetadata extends Omit<MapVariant, "name"> {
  variants?: MapVariant[];
}

export const MAP_METADATA: Record<GameMap, MapMetadata> = {
  [GameMap.AhtenCity]: {
    blurredImage: "/maps/Ahten_City_Blurred.png",
    image: "/maps/Ahten_City.png",
    icon: "/maps/Ahten_City_Icon.png",
  },
  [GameMap.AimisApp]: {
    blurredImage: "/maps/AiMis_App_Blurred.png",
    image: "/maps/AiMis_App.png",
    icon: "/maps/AiMis_App_Icon.png",
  },
  [GameMap.AtlasLab]: {
    blurredImage: "/maps/Atlas_Lab_Blurred.png",
    image: "/maps/Atlas_Lab.png",
    icon: "/maps/Atlas_Lab_Icon.png",
  },
  [GameMap.ClarionTestChamber]: {
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
  [GameMap.DemonDais]: {
    blurredImage: "/maps/Demon_Dais_Blurred.png",
    image: "/maps/Demon_Dais.png",
    icon: "/maps/Demon_Dais_Icon.png",
  },
  [GameMap.GatesOfObscura]: {
    blurredImage: "/maps/Gates_of_Obscura_Blurred.png",
    image: "/maps/Gates_of_Obscura.png",
    icon: "/maps/Gates_of_Obscura_Icon.png",
  },
  [GameMap.InkysSplashZone]: {
    blurredImage: "/maps/Inkys_Splash_Zone_Blurred.png",
    image: "/maps/Inkys_Splash_Zone.png",
    icon: "/maps/Inkys_Splash_Zone_Icon.png",
  },
  [GameMap.NightMarket]: {
    blurredImage: "/maps/Night_Market_Blurred.png",
    image: "/maps/Night_Market.png",
    icon: "/maps/Night_Market_Icon.png",
  },
  [GameMap.OniVillage]: {
    blurredImage: "/maps/Oni_Village_Blurred.png",
    image: "/maps/Oni_Village.png",
    icon: "/maps/Oni_Village_Icon.png",
  },
  [GameMap.TaikoTemple]: {
    blurredImage: "/maps/Taiko_Temple_Blurred.png",
    image: "/maps/Taiko_Temple.png",
    icon: "/maps/Taiko_Temple_Icon.png",
  },
};

export const DEFAULT_MAPS = [
  GameMap.AhtenCity,
  GameMap.AimisApp,
  GameMap.AtlasLab,
  GameMap.ClarionTestChamber,
  GameMap.DemonDais,
  GameMap.GatesOfObscura,
  GameMap.InkysSplashZone,
];

export const AWAKENING_ICONS: Record<Awakening, string> = {
  [Awakening.AdrenalineRush]: "/awakenings/Adrenaline_Rush.png",
  [Awakening.Aerials]: "/awakenings/Aerials.png",
  [Awakening.AmongTitans]: "/awakenings/Among_Titans.png",
  [Awakening.Berserker]: "/awakenings/Berserker.png",
  [Awakening.BigFish]: "/awakenings/Big_Fish.png",
  [Awakening.BuiltDifferent]: "/awakenings/Built_Different.png",
  [Awakening.BulkUp]: "/awakenings/Bulk_Up.png",
  [Awakening.CastToLast]: "/awakenings/Cast_to_Last.png",
  [Awakening.Catalyst]: "/awakenings/Catalyst.png",
  [Awakening.Chronoboost]: "/awakenings/Chronoboost.png",
  [Awakening.Deadeye]: "/awakenings/Deadeye.png",
  [Awakening.Demolitionist]: "/awakenings/Demolitionist.png",
  [Awakening.Egoist]: "/awakenings/Egoist.png",
  [Awakening.ExplosiveEntrance]: "/awakenings/Explosive_Entrance.png",
  [Awakening.ExtraSpecial]: "/awakenings/Extra_Special.png",
  [Awakening.FightOrFlight]: "/awakenings/Fight_or_Flight.png",
  [Awakening.FireUp]: "/awakenings/Fire_Up!.png",
  [Awakening.GlassCannon]: "/awakenings/Glass_Cannon.png",
  [Awakening.HeavyHanded]: "/awakenings/Heavy_Handed.png",
  [Awakening.HeavyImpact]: "/awakenings/Heavy_Impact.png",
  [Awakening.Hotshot]: "/awakenings/Hotshot.png",
  [Awakening.InnerFocus]: "/awakenings/Inner_Focus.png",
  [Awakening.KnifesEdge]: "/awakenings/Knife's_Edge.png",
  [Awakening.MightOfTheColossus]: "/awakenings/Might_of_the_Colossus.png",
  [Awakening.MissilePropulsion]: "/awakenings/Missile_Propulsion.png",
  [Awakening.Monumentalist]: "/awakenings/Monumentalist.png",
  [Awakening.OmegaInfusedAccelerator]: "/awakenings/Omega_Infused_Accelerator.png",
  [Awakening.OneTwoPunch]: "/awakenings/One-Two_Punch.png",
  [Awakening.OrbDancer]: "/awakenings/Orb_Dancer.png",
  [Awakening.OrbPonderer]: "/awakenings/Orb_Ponderer.png",
  [Awakening.OrbReplicator]: "/awakenings/Orb_Replicator.png",
  [Awakening.PeakPerformance]: "/awakenings/Peak_Performance.png",
  [Awakening.PerfectForm]: "/awakenings/Perfect_Form.png",
  [Awakening.Primetime]: "/awakenings/Primetime.png",
  [Awakening.PrizeFighter]: "/awakenings/Prize_Fighter.png",
  [Awakening.QuickReflexes]: "/awakenings/Quick_Reflexes.png",
  [Awakening.QuickStrike]: "/awakenings/Quick_Strike.png",
  [Awakening.Rampage]: "/awakenings/Rampage.png",
  [Awakening.RapidFire]: "/awakenings/Rapid_Fire.png",
  [Awakening.RecoveryDrone]: "/awakenings/Recovery_Drone.png",
  [Awakening.ReptileRemedy]: "/awakenings/Reptile_Remedy.png",
  [Awakening.Reverberation]: "/awakenings/Reverberation.png",
  [Awakening.SiegeMachine]: "/awakenings/Siege_Machine.png",
  [Awakening.SparkOfAgility]: "/awakenings/Spark_of_Agility.png",
  [Awakening.SparkOfFocus]: "/awakenings/Spark_of_Focus.png",
  [Awakening.SparkOfResilience]: "/awakenings/Spark_of_Resilience.png",
  [Awakening.SparkOfStrength]: "/awakenings/Spark_of_Strength.png",
  [Awakening.SparkOfLeadership]: "/awakenings/Spark_of_Leadership.png",
  [Awakening.SpecializedTraining]: "/awakenings/Specialized_Training.png",
  [Awakening.StacksOnStacks]: "/awakenings/Stacks_On_Stacks.png",
  [Awakening.StaggerSwagger]: "/awakenings/Stagger_Swagger.png",
  [Awakening.Stinger]: "/awakenings/Stinger.png",
  [Awakening.SuperSurge]: "/awakenings/Super_Surge.png",
  [Awakening.TeamPlayer]: "/awakenings/Team_Player.png",
  [Awakening.TempoSwing]: "/awakenings/Tempo_Swing.png",
  [Awakening.TimelessCreator]: "/awakenings/Timeless_Creator.png",
  [Awakening.TwinDrive]: "/awakenings/Twin_Drive.png",
  [Awakening.Unstoppable]: "/awakenings/Unstoppable.png",
};

export const DEFAULT_BANNED_AWAKENINGS = [Awakening.SparkOfLeadership, Awakening.TeamPlayer, Awakening.FireUp];

export enum StrikerDirection {
  Left = "left",
  Right = "right",
}

export interface StrikerMetadata {
  splash: string;
  icon: string;
  facing: StrikerDirection;
}

export const STRIKER_METADATA: Record<Striker, StrikerMetadata> = {
  [Striker.AiMi]: {
    splash: "/strikers/Ai.Mi_splash.png",
    icon: "/strikers/Ai.Mi_icon.png",
    facing: StrikerDirection.Right,
  },
  [Striker.Asher]: {
    splash: "/strikers/Asher_splash.png",
    icon: "/strikers/Asher_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Atlas]: {
    splash: "/strikers/Atlas_splash.png",
    icon: "/strikers/Atlas_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Drekar]: {
    splash: "/strikers/Drek'ar_splash.png",
    icon: "/strikers/Drek'ar_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Dubu]: {
    splash: "/strikers/Dubu_splash.png",
    icon: "/strikers/Dubu_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Era]: {
    splash: "/strikers/Era_splash.png",
    icon: "/strikers/Era_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Estelle]: {
    splash: "/strikers/Estelle_splash.png",
    icon: "/strikers/Estelle_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Finii]: {
    splash: "/strikers/Finii_splash.png",
    icon: "/strikers/Finii_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Juliette]: {
    splash: "/strikers/Juliette_splash.png",
    icon: "/strikers/Juliette_icon.png",
    facing: StrikerDirection.Right,
  },
  [Striker.Juno]: {
    splash: "/strikers/Juno_splash.png",
    icon: "/strikers/Juno_icon.png",
    facing: StrikerDirection.Right,
  },
  [Striker.Kai]: {
    splash: "/strikers/Kai_splash.png",
    icon: "/strikers/Kai_icon.png",
    facing: StrikerDirection.Right,
  },
  [Striker.Kazan]: {
    splash: "/strikers/Kazan_splash.png",
    icon: "/strikers/Kazan_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Luna]: {
    splash: "/strikers/Luna_splash.png",
    icon: "/strikers/Luna_icon.png",
    facing: StrikerDirection.Right,
  },
  [Striker.Mako]: {
    splash: "/strikers/Mako_splash.png",
    icon: "/strikers/Mako_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Nao]: {
    splash: "/strikers/Nao_Splash.png",
    icon: "/strikers/Nao_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Octavia]: {
    splash: "/strikers/Octavia_splash.png",
    icon: "/strikers/Octavia_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Rasmus]: {
    splash: "/strikers/Rasmus_splash.png",
    icon: "/strikers/Rasmus_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Rune]: {
    splash: "/strikers/Rune_splash.png",
    icon: "/strikers/Rune_icon.png",
    facing: StrikerDirection.Right,
  },
  [Striker.Vyce]: {
    splash: "/strikers/Vyce_splash.png",
    icon: "/strikers/Vyce_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.X]: {
    splash: "/strikers/X_splash.png",
    icon: "/strikers/X_icon.png",
    facing: StrikerDirection.Left,
  },
  [Striker.Zentaro]: {
    splash: "/strikers/Zentaro_splash.png",
    icon: "/strikers/Zentaro_icon.png",
    facing: StrikerDirection.Left,
  },
};

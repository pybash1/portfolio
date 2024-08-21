export interface Lanyard {
  success: boolean;
  data: {
    spotify?: Spotify;
    listening_to_spotify: boolean;
    kv: {
      [key: string]: string;
    };
    discord_user: DiscordUser;
    discord_status: "online" | "offline" | "idle" | "dnd";
    activities: Activity[];
    active_on_discord_web: boolean;
    active_on_discord_mobile: boolean;
    active_on_discord_desktop: boolean;
  };
}

export interface Spotify {
  track_id: string;
  timestamps: {
    start: number;
    end: number;
  };
  song: string;
  artist: string;
  album_art_url: string;
  album: string;
}

export interface Activity {
  type: number;
  timestamps: {
    start: number;
    end?: number;
  };
  sync_id?: string;
  state: string;
  session_id: string;
  party?: {
    id: string;
  };
  name: string;
  id: string;
  details: string;
  created_at: number;
  buttons?: string[];
  application_id?: string;
  assets: {
    [key: string]: string;
  };
}

export interface DiscordUser {
  username: string;
  public_flags: number;
  id: string;
  global_name: string | null;
  display_name: string | null;
  discriminator: string | null;
  bot: boolean;
  avatar_decoration: null;
  avatar: string;
}

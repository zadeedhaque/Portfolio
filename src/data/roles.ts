export interface Role {
  name: string;
  summary: string;
  tags: string[];
  /** Where to watch the work, if public. */
  watch?: string;
}

// Creator-mode cards. Roles are cards only; they have no pages.
export const roles: Role[] = [
  { name: "Production Lead", summary: "Ran a small crew, concept to final cut.", tags: ["Brain Stormers", "2023 – 24"] },
  { name: "Director", summary: "Educational films, first idea to finish.", tags: ["Directing"] },
  { name: "Video Editor", summary: "Cut for a channel now at 10k subscribers.", tags: ["After Effects", "2021 – 23"] },
  { name: "Graphic Designer", summary: "Brand graphics, thumbnails, overlays.", tags: ["Illustrator"] },
  { name: "Photographer", summary: "Light, framing and people.", tags: ["Nikon D3400"] },
  { name: "Videographer", summary: "Camera, lighting and set.", tags: ["On set"] },
  { name: "Streamer", summary: "1080p60 from a self-built rig.", tags: ["YouTube", "NVENC"], watch: "https://www.youtube.com/@ZadeedHaque" },
];

/** Words in the Creator skills marquee. */
export const creatorWords = ["Directing", "Editing", "Motion", "Design", "Photography", "Streaming", "After Effects", "Illustrator"];

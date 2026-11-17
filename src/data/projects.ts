export interface Project {
  slug: string;
  name: string;
  summary: string;
  tags: [string, string];
  /** Live build. */
  play?: string;
  /** Source repository. */
  code?: string;
  /** Path under public/, e.g. "/media/lava-lift.mp4". Leave unset until a video exists. */
  video?: string;
  /** Poster image for the video, path under public/. */
  poster?: string;
}

// To add a project: add an entry here and a Markdown case study at
// src/content/case-studies/<slug>.md. The page at /work/<slug> is generated.
export const projects: Project[] = [
  { slug: "lava-lift", name: "Lava Lift", summary: "Helicopter rescue with ragdoll physics.", tags: ["Game", "Matter.js"], play: "https://lava-lift.vercel.app", code: "https://github.com/zadeedhaque/Lava-Lift", video: "/media/lava-lift.mp4", poster: "/media/lava-lift.jpg" },
  { slug: "learn-salah", name: "Learn Salah", summary: "A 3D prayer guide in three languages.", tags: ["3D app", "React"], play: "https://learn-salah.zadeedhaque.com", code: "https://github.com/zadeedhaque/Learn-Salah", video: "/media/learn-salah.mp4", poster: "/media/learn-salah.jpg" },
  { slug: "dhakar-rasta", name: "Dhakar Rasta", summary: "Survive Dhaka traffic, in Bangla.", tags: ["3D game", "Three.js"], play: "https://dhakar-rasta.vercel.app", code: "https://github.com/zadeedhaque/Dhakar-Rasta", video: "/media/dhakar-rasta.mp4", poster: "/media/dhakar-rasta.jpg" },
  { slug: "physics-lab", name: "HSC Physics Lab", summary: "153 topics, 115 simulations, 308 tests.", tags: ["Education", "React"], play: "https://hsc-physics.zadeedhaque.com", code: "https://github.com/zadeedhaque/hsc-physics-lab", video: "/media/physics-lab.mp4", poster: "/media/physics-lab.jpg" },
  { slug: "ssc-physics", name: "SSC Physics Lab", summary: "Bangla-first SSC physics: 31 simulations, 91 MCQs.", tags: ["Education", "Three.js"], play: "https://ssc-physics.zadeedhaque.com", video: "/media/ssc-physics.mp4", poster: "/media/ssc-physics.jpg" },
  { slug: "crownfall", name: "Crownfall", summary: "Parkour platformer, zero asset files.", tags: ["Game", "Phaser 3"], play: "https://zadeedhaque.github.io/CROWNFALL/", code: "https://github.com/zadeedhaque/CROWNFALL", video: "/media/crownfall.mp4", poster: "/media/crownfall.jpg" },
  { slug: "neon-snake", name: "Neon Snake", summary: "Snake in real 3D with custom shaders.", tags: ["3D game", "GLSL"], play: "https://zadeedhaque.github.io/neon-snake/", code: "https://github.com/zadeedhaque/neon-snake", video: "/media/neon-snake.mp4", poster: "/media/neon-snake.jpg" },
  { slug: "handwritten-numbers", name: "Handwritten Numbers", summary: "A CNN that reads handwriting. 89% exact.", tags: ["AI", "TensorFlow"], play: "https://huggingface.co/spaces/Zadeed/handwritten-number-recogniser", code: "https://github.com/ZadeedSwin/HNR-COS30018", video: "/media/handwritten-numbers.mp4", poster: "/media/handwritten-numbers.jpg" },
  { slug: "medicare-bd", name: "MediCare BD", summary: "Hospital booking platform, four roles.", tags: ["Full-stack", "Next.js"] },
  { slug: "spin-and-win", name: "Spin & Win", summary: "A prize wheel that cannot lie about odds.", tags: ["Web app", "React"], play: "https://zadeedhaque.github.io/prize-spinner/", code: "https://github.com/zadeedhaque/prize-spinner", video: "/media/spin-and-win.mp4", poster: "/media/spin-and-win.jpg" },
  { slug: "60-projects", name: "60 Projects", summary: "Sixty programs, each in C++ and Java.", tags: ["Challenge", "C++ · Java"], code: "https://github.com/zadeedhaque/60-Projects-Challenge" },
];

/** Words in the Developer skills marquee. */
export const devWords = ["AI", "Web", "Games", "Three.js", "Cloud", "TypeScript", "Python", "Zero assets"];

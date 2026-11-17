export interface TimelineRow {
  when: string;
  what: string;
}

/** Short timelines shown in the home About section. */
export const devTimeline: TimelineRow[] = [
  { when: "Now – 2027", what: "Swinburne · Computer Science, AI" },
  { when: "2024 – 2025", what: "BRAC University · CSE" },
  { when: "2022 – 2023", what: "Rajuk Uttara Model College" },
];
export const creatorTimeline: TimelineRow[] = [
  { when: "2023 – 2024", what: "Production Lead · Brain Stormers" },
  { when: "2021 – 2023", what: "Freelance Video Editor" },
  { when: "Certificate", what: "Graphic Design · Creative IT" },
];

/** Full study timeline on the Academics page. */
/** `logo` is a path under public/. The logos are drawn for dark backgrounds, so the page sets them on a dark tile. */
export const study: { when: string; school: string; detail: string; logo: string }[] = [
  { when: "Now – 2027", school: "Swinburne University of Technology", detail: "Bachelor of Computer Science · AI major", logo: "/logos/swinburne.png" },
  { when: "2024 – 2025", school: "BRAC University", detail: "Computer Science & Engineering · CGPA 3.64 / 4.00 · credit transferred", logo: "/logos/brac.png" },
  { when: "2022 – 2023", school: "Rajuk Uttara Model College", detail: "Higher Secondary Certificate · GPA 5.00 / 5.00", logo: "/logos/rajuk.png" },
  { when: "Certificate", school: "Creative IT Institute", detail: "Graphic Design · Adobe Illustrator", logo: "/logos/creative-it.png" },
];

export const scores: string[] = ["IELTS 7.5", "SAT 1300"];

export const coursework: { name: string; summary: string; href?: string }[] = [
  { name: "Cloud Computing Architecture", summary: "One Photo Album app, built three ways on AWS: on EC2, highly available, then serverless.", href: "/academics/cloud-computing" },
  { name: "Multi-AZ VPC", summary: "A custom VPC across two Availability Zones with a bastion host, MySQL and locked-down security groups." },
  { name: "Flood-Resilience Raft", summary: "A low-cost floating household raft with solar power and sensors, designed for Wadeye, NT." },
  { name: "Web Projects", summary: "Semantic, responsive sites with validated forms, published on GitHub Pages." },
];

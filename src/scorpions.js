(function () {
  const M = (id, name, svg) => ({ id, name, svg });

  window.SCORPION_MODELS = [
    M("classic", "Classic", `<g fill="currentColor">
      <ellipse cx="30" cy="36" rx="11" ry="5"/>
      <circle cx="18" cy="36" r="5"/>
      <path d="M14 32 Q6 26 2 22 L4 27 L10 30 L4 30 L8 34 L14 34 Z"/>
      <path d="M14 40 Q6 46 2 50 L4 45 L10 42 L4 42 L8 38 L14 38 Z"/>
      <rect class="leg leg-a" x="20" y="40" width="2.4" height="9" rx="1.2"/>
      <rect class="leg leg-b" x="26" y="40" width="2.4" height="11" rx="1.2"/>
      <rect class="leg leg-c" x="32" y="40" width="2.4" height="11" rx="1.2"/>
      <rect class="leg leg-d" x="38" y="40" width="2.4" height="9" rx="1.2"/>
      <path d="M41 36 Q52 35 55 25 Q58 13 49 8 L46 13 Q53 16 52 24 Q51 30 41 32 Z"/>
      <path d="M49 8 L56 2 L52 11 Z"/>
    </g>`),

    M("cute", "Cute", `<g fill="currentColor">
      <ellipse cx="32" cy="42" rx="11" ry="6"/>
      <circle cx="20" cy="36" r="10"/>
      <ellipse cx="16" cy="34" rx="1.7" ry="2.4" fill="#ffffff"/>
      <ellipse cx="24" cy="34" rx="1.7" ry="2.4" fill="#ffffff"/>
      <ellipse cx="16.3" cy="34.6" rx="0.9" ry="1.3" fill="#0f1420"/>
      <ellipse cx="24.3" cy="34.6" rx="0.9" ry="1.3" fill="#0f1420"/>
      <circle cx="13" cy="40" r="1.5" fill="#fb923c" opacity="0.55"/>
      <circle cx="27" cy="40" r="1.5" fill="#fb923c" opacity="0.55"/>
      <ellipse cx="10" cy="32" rx="4" ry="2.5"/>
      <ellipse cx="10" cy="40" rx="4" ry="2.5"/>
      <rect class="leg leg-a" x="22" y="46" width="2.4" height="6" rx="1.2"/>
      <rect class="leg leg-b" x="28" y="46" width="2.4" height="7" rx="1.2"/>
      <rect class="leg leg-c" x="34" y="46" width="2.4" height="6" rx="1.2"/>
      <path d="M42 40 Q52 38 54 28 Q55 18 48 16 L46 20 Q51 22 50 28 Q49 34 42 36 Z"/>
      <circle cx="48" cy="16" r="3.5"/>
      <path d="M46 14 L51 11" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    </g>`),

    M("royal", "Royal", `<g fill="currentColor">
      <ellipse cx="30" cy="36" rx="11" ry="5"/>
      <circle cx="18" cy="36" r="5"/>
      <path d="M12 30 L14 24 L17 28 L18 22 L19 28 L22 24 L24 30 L22 32 L14 32 Z" fill="#fbbf24"/>
      <circle cx="14" cy="25" r="1" fill="#ef4444"/>
      <circle cx="18" cy="23" r="1" fill="#10b981"/>
      <circle cx="22" cy="25" r="1" fill="#3b82f6"/>
      <path d="M14 32 Q6 26 2 22 L4 27 L10 30 L4 30 L8 34 L14 34 Z"/>
      <path d="M14 40 Q6 46 2 50 L4 45 L10 42 L4 42 L8 38 L14 38 Z"/>
      <rect class="leg leg-a" x="20" y="40" width="2.4" height="9" rx="1.2"/>
      <rect class="leg leg-b" x="26" y="40" width="2.4" height="11" rx="1.2"/>
      <rect class="leg leg-c" x="32" y="40" width="2.4" height="11" rx="1.2"/>
      <rect class="leg leg-d" x="38" y="40" width="2.4" height="9" rx="1.2"/>
      <path d="M41 36 Q52 35 55 25 Q58 13 49 8 L46 13 Q53 16 52 24 Q51 30 41 32 Z"/>
      <path d="M49 8 L56 2 L52 11 Z"/>
    </g>`),

    M("ninja", "Ninja", `<g fill="currentColor">
      <ellipse cx="30" cy="36" rx="11" ry="5"/>
      <circle cx="18" cy="36" r="5"/>
      <rect x="12" y="34" width="14" height="3.2" fill="#1f2937"/>
      <ellipse cx="16" cy="35.6" rx="0.9" ry="0.7" fill="#ffffff"/>
      <ellipse cx="20" cy="35.6" rx="0.9" ry="0.7" fill="#ffffff"/>
      <path d="M26 33 L31 30 L27 38 Z" fill="#1f2937"/>
      <path d="M26 36 L32 38 L28 39 Z" fill="#1f2937"/>
      <path d="M14 32 Q6 26 2 22 L4 27 L10 30 L4 30 L8 34 L14 34 Z"/>
      <path d="M14 40 Q6 46 2 50 L4 45 L10 42 L4 42 L8 38 L14 38 Z"/>
      <rect class="leg leg-a" x="20" y="40" width="2.4" height="9" rx="1.2"/>
      <rect class="leg leg-b" x="26" y="40" width="2.4" height="11" rx="1.2"/>
      <rect class="leg leg-c" x="32" y="40" width="2.4" height="11" rx="1.2"/>
      <rect class="leg leg-d" x="38" y="40" width="2.4" height="9" rx="1.2"/>
      <path d="M41 36 Q52 35 55 25 Q58 13 49 8 L46 13 Q53 16 52 24 Q51 30 41 32 Z"/>
      <path d="M49 8 L56 2 L52 11 Z"/>
    </g>`),

    M("battle", "Battle", `<g fill="currentColor">
      <ellipse cx="34" cy="42" rx="11" ry="5"/>
      <circle cx="22" cy="42" r="5"/>
      <path d="M18 39 L 12 28 L 8 22 L 12 26 L 8 28 L 14 32 L 18 36 Z"/>
      <path d="M18 45 L 14 56 L 10 60 L 14 56 L 10 60 L 16 52 L 19 48 Z"/>
      <rect class="leg leg-a" x="24" y="46" width="2.4" height="9" rx="1.2"/>
      <rect class="leg leg-b" x="30" y="46" width="2.4" height="11" rx="1.2"/>
      <rect class="leg leg-c" x="36" y="46" width="2.4" height="11" rx="1.2"/>
      <rect class="leg leg-d" x="42" y="46" width="2.4" height="9" rx="1.2"/>
      <path d="M45 42 Q56 41 58 31 Q60 19 52 14 L50 19 Q57 21 56 28 Q55 34 45 36 Z"/>
      <path d="M52 14 L60 8 L55 17 Z"/>
    </g>`),

    M("slim", "Slim", `<g fill="currentColor">
      <ellipse cx="28" cy="36" rx="14" ry="3.5"/>
      <circle cx="14" cy="36" r="3.5"/>
      <path d="M11 34 L 4 30 L 6 34 L 11 34 Z"/>
      <path d="M11 38 L 4 42 L 6 38 L 11 38 Z"/>
      <rect class="leg leg-a" x="16" y="39" width="1.6" height="6" rx="0.8"/>
      <rect class="leg leg-b" x="22" y="39" width="1.6" height="7" rx="0.8"/>
      <rect class="leg leg-c" x="28" y="39" width="1.6" height="7" rx="0.8"/>
      <rect class="leg leg-d" x="34" y="39" width="1.6" height="6" rx="0.8"/>
      <path d="M42 36 Q54 34 56 22 Q57 10 50 6 L48 10 Q55 12 53 20 Q51 28 42 32 Z"/>
      <path d="M50 6 L58 0 L54 8 Z"/>
    </g>`),

    M("coil", "Coiled", `<g fill="currentColor">
      <ellipse cx="22" cy="40" rx="10" ry="5"/>
      <circle cx="12" cy="40" r="4"/>
      <path d="M8 36 L 2 32 L 4 38 L 8 40 Z"/>
      <path d="M8 44 L 2 48 L 4 42 L 8 40 Z"/>
      <rect class="leg leg-a" x="14" y="44" width="2.4" height="7" rx="1.2"/>
      <rect class="leg leg-b" x="20" y="44" width="2.4" height="8" rx="1.2"/>
      <rect class="leg leg-c" x="26" y="44" width="2.4" height="7" rx="1.2"/>
      <path d="M32 40 Q 42 40 42 30 Q 42 20 50 20 Q 58 20 58 12 L 54 14 Q 54 18 50 18 Q 46 18 46 26 Q 46 36 36 36 Q 32 36 32 40 Z"/>
      <path d="M58 12 L 62 6 L 56 12 Z"/>
    </g>`),

    M("sharp", "Sharp", `<g fill="currentColor">
      <polygon points="18,32 38,28 38,40 18,36"/>
      <polygon points="8,36 18,30 18,42"/>
      <polygon points="2,30 14,32 8,36"/>
      <polygon points="2,42 14,40 8,36"/>
      <polygon points="22,40 22,48 26,42"/>
      <polygon points="30,40 30,48 34,42"/>
      <polygon points="38,40 38,48 42,42"/>
      <polygon points="38,32 50,28 56,18 50,8 48,16 46,24 42,28"/>
      <polygon points="50,8 58,2 53,14"/>
    </g>`),

    M("outline", "Outline", `<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="30" cy="36" rx="11" ry="5"/>
      <circle cx="18" cy="36" r="4.5"/>
      <path d="M14 32 L 4 26 L 6 30 L 11 32"/>
      <path d="M14 40 L 4 46 L 6 42 L 11 40"/>
      <path d="M22 41 L 20 48 M 28 42 L 28 49 M 34 42 L 34 49 M 40 41 L 42 48"/>
      <path d="M41 36 Q 54 35 56 24 Q 58 12 49 8"/>
      <path d="M49 8 L 56 2 L 52 11 Z"/>
    </g>`),

    M("pixel", "Pixel", `<g fill="currentColor" shape-rendering="crispEdges">
      <rect x="20" y="32" width="20" height="10"/>
      <rect x="14" y="34" width="6" height="6"/>
      <rect x="8" y="32" width="6" height="3"/>
      <rect x="8" y="39" width="6" height="3"/>
      <rect x="4" y="30" width="4" height="3"/>
      <rect x="4" y="41" width="4" height="3"/>
      <rect class="leg leg-a" x="22" y="42" width="3" height="6"/>
      <rect class="leg leg-b" x="28" y="42" width="3" height="6"/>
      <rect class="leg leg-c" x="34" y="42" width="3" height="6"/>
      <rect x="40" y="30" width="6" height="4"/>
      <rect x="44" y="24" width="6" height="6"/>
      <rect x="48" y="16" width="4" height="8"/>
      <rect x="46" y="10" width="6" height="6"/>
      <rect x="50" y="6" width="4" height="4"/>
    </g>`),

    M("topview", "Top View", `<g fill="currentColor">
      <ellipse cx="32" cy="32" rx="6" ry="10"/>
      <circle cx="32" cy="20" r="5"/>
      <path d="M27 16 L 18 10 L 14 8 L 16 12 L 13 12 L 18 16 L 24 18 Z"/>
      <path d="M37 16 L 46 10 L 50 8 L 48 12 L 51 12 L 46 16 L 40 18 Z"/>
      <rect class="leg leg-a" x="20" y="27" width="6" height="1.8" rx="0.9" transform="rotate(-20 23 28)"/>
      <rect class="leg leg-b" x="20" y="32" width="6" height="1.8" rx="0.9"/>
      <rect class="leg leg-c" x="20" y="37" width="6" height="1.8" rx="0.9" transform="rotate(20 23 38)"/>
      <rect x="38" y="27" width="6" height="1.8" rx="0.9" transform="rotate(20 41 28)"/>
      <rect x="38" y="32" width="6" height="1.8" rx="0.9"/>
      <rect x="38" y="37" width="6" height="1.8" rx="0.9" transform="rotate(-20 41 38)"/>
      <path d="M32 42 Q 32 50 40 52 Q 50 52 52 44 L 48 44 Q 48 48 42 48 Q 38 47 38 42 Z"/>
      <path d="M52 44 L 60 42 L 54 50 Z"/>
    </g>`),

    M("pup", "Pup", `<g fill="currentColor">
      <ellipse cx="30" cy="42" rx="7" ry="4.5"/>
      <circle cx="20" cy="38" r="9"/>
      <ellipse cx="16" cy="36" rx="1.8" ry="2.4" fill="#ffffff"/>
      <ellipse cx="24" cy="36" rx="1.8" ry="2.4" fill="#ffffff"/>
      <ellipse cx="16.3" cy="36.6" rx="0.9" ry="1.3" fill="#0f1420"/>
      <ellipse cx="24.3" cy="36.6" rx="0.9" ry="1.3" fill="#0f1420"/>
      <path d="M17 42 Q20 44 23 42" stroke="#0f1420" stroke-width="0.8" fill="none" stroke-linecap="round"/>
      <ellipse cx="11" cy="36" rx="2.8" ry="2"/>
      <ellipse cx="11" cy="42" rx="2.8" ry="2"/>
      <rect class="leg leg-a" x="24" y="46" width="2" height="5" rx="1"/>
      <rect class="leg leg-b" x="29" y="46" width="2" height="6" rx="1"/>
      <path d="M36 42 Q 44 40 45 32 Q 46 24 41 22 L 39 25 Q 43 26 42 30 Q 41 35 36 36 Z"/>
      <circle cx="42" cy="22" r="2.8"/>
    </g>`)
  ];

  window.SCORPION_COLORS = [
    { id: "accent", name: "Theme", value: null },
    { id: "crimson", name: "Crimson", value: "#ef4444" },
    { id: "tangerine", name: "Tangerine", value: "#f97316" },
    { id: "gold", name: "Gold", value: "#f59e0b" },
    { id: "emerald", name: "Emerald", value: "#10b981" },
    { id: "teal", name: "Teal", value: "#14b8a6" },
    { id: "sky", name: "Sky", value: "#0ea5e9" },
    { id: "indigo", name: "Indigo", value: "#6366f1" },
    { id: "violet", name: "Violet", value: "#a855f7" },
    { id: "pink", name: "Pink", value: "#ec4899" },
    { id: "slate", name: "Slate", value: "#64748b" },
    { id: "obsidian", name: "Obsidian", value: "#0f172a" }
  ];
})();

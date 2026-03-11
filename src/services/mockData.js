export const featuredDrivers = [
  {
    driver_id: "hamilton",
    first_name: "Lewis",
    last_name: "Hamilton",
    nationality: "British",
    debut_year: 2007,
    photo_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
  },
  {
    driver_id: "schumacher",
    first_name: "Michael",
    last_name: "Schumacher",
    nationality: "German",
    debut_year: 1991,
    photo_url:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80",
  },
  {
    driver_id: "senna",
    first_name: "Ayrton",
    last_name: "Senna",
    nationality: "Brazilian",
    debut_year: 1984,
    photo_url:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=400&q=80",
  },
];

export const featuredConstructors = [
  {
    constructor_id: "ferrari",
    name: "Scuderia Ferrari",
    nationality: "Italian",
    championships: 16,
    logo_url:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80",
  },
  {
    constructor_id: "mclaren",
    name: "McLaren Racing",
    nationality: "British",
    championships: 8,
    logo_url:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=400&q=80",
  },
];

export const latestRaces = [
  {
    race_id: "abu-dhabi-2024",
    season_year: 2024,
    round: 24,
    race_name: "Abu Dhabi Grand Prix",
    circuit_name: "Yas Marina Circuit",
    date: "2024-12-08",
  },
  {
    race_id: "las-vegas-2024",
    season_year: 2024,
    round: 23,
    race_name: "Las Vegas Grand Prix",
    circuit_name: "Las Vegas Strip",
    date: "2024-11-23",
  },
];

export const sampleStandings = {
  drivers: [
    { id: 1, position: 1, driver_name: "Max Verstappen", wins: 12, points: 575 },
    { id: 2, position: 2, driver_name: "Lando Norris", wins: 7, points: 415 },
    { id: 3, position: 3, driver_name: "Charles Leclerc", wins: 5, points: 380 },
  ],
  constructors: [
    { id: 1, position: 1, constructor_name: "Red Bull Racing", wins: 16, points: 860 },
    { id: 2, position: 2, constructor_name: "McLaren", wins: 7, points: 635 },
    { id: 3, position: 3, constructor_name: "Ferrari", wins: 6, points: 585 },
  ],
};

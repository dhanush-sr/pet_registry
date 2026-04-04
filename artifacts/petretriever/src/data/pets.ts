export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  image: string;
  verified: boolean;
  vaccinations: string[];
  lastCheckupDate: string;
}

export const pets: Pet[] = [
  {
    id: "DOG001",
    name: "Buddy",
    breed: "Golden Retriever",
    age: 3,
    image: "/images/dogs/dogo1.jpeg",
    verified: false,
    vaccinations: ["Rabies", "Parvo", "Distemper"],
    lastCheckupDate: "2025-11-15",
  },
  {
    id: "DOG002",
    name: "Max",
    breed: "German Shepherd",
    age: 5,
    image: "/images/dogs/dogo2.jpeg",
    verified: false,
    vaccinations: ["Rabies", "Parvo", "Bordetella"],
    lastCheckupDate: "2025-09-22",
  },
  {
    id: "DOG003",
    name: "Bella",
    breed: "Labrador Retriever",
    age: 2,
    image: "/images/dogs/dogo3.jpeg",
    verified: false,
    vaccinations: ["Rabies", "Distemper", "Leptospirosis"],
    lastCheckupDate: "2026-01-08",
  },
  {
    id: "DOG004",
    name: "Charlie",
    breed: "Beagle",
    age: 4,
    image: "/images/dogs/dogo4.jpeg",
    verified: false,
    vaccinations: ["Rabies", "Parvo", "Distemper", "Hepatitis"],
    lastCheckupDate: "2025-12-03",
  },
  {
    id: "DOG005",
    name: "Luna",
    breed: "Siberian Husky",
    age: 1,
    image: "/images/dogs/dogo5.jpeg",
    verified: false,
    vaccinations: ["Rabies", "Parvo"],
    lastCheckupDate: "2026-02-14",
  },
  {
    id: "DOG006",
    name: "Rocky",
    breed: "Rottweiler",
    age: 6,
    image: "/images/dogs/dogo6.jpeg",
    verified: true,
    vaccinations: ["Rabies", "Distemper", "Parvo", "Bordetella"],
    lastCheckupDate: "2025-10-30",
  },
  {
    id: "DOG007",
    name: "Daisy",
    breed: "Poodle",
    age: 3,
    image: "/images/dogs/dogo7.jpeg",
    verified: true,
    vaccinations: ["Rabies", "Leptospirosis", "Canine Influenza"],
    lastCheckupDate: "2026-03-01",
  },
  {
    id: "DOG008",
    name: "Cooper",
    breed: "Border Collie",
    age: 2,
    image: "/images/dogs/dogo8.jpeg",
    verified: true,
    vaccinations: ["Rabies", "Parvo", "Distemper"],
    lastCheckupDate: "2025-08-19",
  },
  {
    id: "DOG009",
    name: "Datta",
    breed: "Labrador",
    age: 4,
    image: "/images/dogs/datta.jpeg",
    verified: true,
    vaccinations: ["Rabies", "Parvo", "Distemper", "Leptospirosis"],
    lastCheckupDate: "2026-01-25",
  },
  {
    id: "DOG010",
    name: "Skye",
    breed: "Golden Retriever",
    age: 3,
    image: "/images/dogs/skye.jpg",
    verified: true,
    vaccinations: ["Rabies", "Bordetella", "Canine Influenza"],
    lastCheckupDate: "2026-02-28",
  },
];

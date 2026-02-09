const foodItems = [
  {
    id: 1,
    title: "Plateau Gâteaux Traditionnels",
    donor: "Maison Amoud",
    type: "Bakery",
    price: 1500,
    originalPrice: 2500,
    image: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&w=800&q=80", // Baklawa/Sweets
    location: "Sidi Yahia, Algiers",
    timeLeft: "2 hours",
    description:
      "بواطة بقلاوة و مقروط و تشاراك، خدمة تاع الدار و بنينة.",
    promoted: true,
    paymentMethods: ["BaridiMob", "CIB"],
  },
  {
    id: 2,
    title: "Pizza Carrée & Coca",
    donor: "Pizzeria L'Etna",
    type: "Restaurant",
    price: 600,
    originalPrice: 1200,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80", // Pizza
    location: "8 Bd de la Soummam, Oran",
    timeLeft: "4 hours",
    description:
      "بيتزا كاري و كوكا سخونة، معمّرة فرماج و زيتون.",
    promoted: false,
    paymentMethods: ["Cash"],
  },
  {
    id: 3,
    title: "Mhajeb Hot Box",
    donor: "Marriott Constantine Protégé",
    type: "Hotel",
    price: 800,
    originalPrice: 2000,
    image: "https://th.bing.com/th/id/OIP.U4k-YwG-G5hJ_A3tG-V-VAHaE8?rs=1&pid=ImgDetMain", // Mhajeb
    location: "Cité universitaire Zouaghi, Constantine",
    timeLeft: "1 hour",
    description:
      "دوزان محاجب حارين و سخونين، بقاو من فطور الصباح.",
    promoted: true,
    paymentMethods: ["BaridiMob", "CIB", "Cash"],
  },
  {
    id: 4,
    title: "Fresh Vegetable Basket",
    donor: "Association Kafil El Yatim",
    type: "NGO",
    price: 300,
    originalPrice: 1000,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80", // Vegetables
    location: "Boufarik, Blida",
    timeLeft: "1 day",
    description: "خضرة طرية من الجنان: طوماطيش، خيار، و زرودية.",
    promoted: false,
    paymentMethods: ["Cash"],
  },
  {
    id: 5,
    title: "Couscous Royal",
    donor: "Restaurant Le Nautique",
    type: "Restaurant",
    price: 1800,
    originalPrice: 4500,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=800&q=80", // Couscous
    location: "Route du Cap de Garde, Annaba",
    timeLeft: "30 mins",
    description:
      "قصعة طعام (كسكسي) باللحم و الخضرة، همة و شان.",
    promoted: true,
    paymentMethods: ["CIB", "BaridiMob"],
  },
  {
    id: 6,
    title: "Matlouh & Kesra",
    donor: "Boulangerie El Baraka",
    type: "Bakery",
    price: 200,
    originalPrice: 500,
    image: "https://images.unsplash.com/photo-1626202492176-b333a824e931?auto=format&fit=crop&w=800&q=80", // Flatbread
    location: "El Eulma, Sétif",
    timeLeft: "3 hours",
    description:
      "مطلوع و كسرة تاع الطاجين، سخونين و طرايا.",
    promoted: false,
    paymentMethods: ["Cash"],
  },
];

const categories = [
  { name: "Restaurants", icon: "fas fa-utensils", link: "restaurants.html" },
  { name: "Hotels", icon: "fas fa-hotel", link: "hotels.html" },
  { name: "Bakeries", icon: "fas fa-bread-slice", link: "bakeries.html" },
  { name: "NGOs", icon: "fas fa-hand-holding-heart", link: "ngo.html" },
];

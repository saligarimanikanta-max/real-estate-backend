/**
 * Database Seeder Script for Real Estate Property Portal
 *
 * Populates sample verified agents, test buyers, an admin, and diverse
 * verified property listings with realistic photos, specs, and locations.
 *
 * Usage:
 *   npm run seed
 *   or: node scripts/seedData.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Property = require("../models/Property");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/realestate_portal";

const sampleUsers = [
  {
    name: "Platform Admin",
    email: "admin@estatehub.com",
    password: "AdminPass123!",
    role: "admin",
    phone: "+91 98800 11223",
    isVerified: true,
  },
  {
    name: "Rahul Verma",
    email: "rahul.agent@estatehub.com",
    password: "AgentPass123!",
    role: "agent",
    phone: "+91 98765 43210",
    isVerified: true,
  },
  {
    name: "Priya Sharma",
    email: "priya.agent@estatehub.com",
    password: "AgentPass123!",
    role: "agent",
    phone: "+91 98450 12345",
    isVerified: true,
  },
  {
    name: "Vikram Malhotra",
    email: "buyer@estatehub.com",
    password: "BuyerPass123!",
    role: "buyer",
    phone: "+91 99001 22334",
    isVerified: true,
  },
];

const sampleProperties = (agent1Id, agent2Id) => [
  {
    agentId: agent1Id,
    title: "Luxury 3BHK Penthouse with Private Terrace",
    description:
      "Stunning 3-bedroom penthouse featuring Italian marble flooring, floor-to-ceiling windows, smart home automation, and an expansive private terrace with panoramic city views.",
    type: "sale",
    propertyType: "apartment",
    price: 18500000,
    city: "Bangalore",
    locality: "Indiranagar",
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2450,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "Available",
    verificationStatus: "Approved",
    isVerified: true,
  },
  {
    agentId: agent2Id,
    title: "Modern 2BHK Apartment near Tech Corridor",
    description:
      "Well-lit contemporary 2BHK apartment in a gated community with clubhouse, infinity pool, 24/7 power backup, and close proximity to major tech parks and metro.",
    type: "rent",
    propertyType: "apartment",
    price: 38000,
    city: "Bangalore",
    locality: "Whitefield",
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1280,
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "Available",
    verificationStatus: "Approved",
    isVerified: true,
  },
  {
    agentId: agent1Id,
    title: "Coastal 4BHK Luxury Villa with Landscaped Garden",
    description:
      "Magnificent Spanish-style 4BHK independent villa with private swimming pool, landscaped lawn, modular European kitchen, and private parking for 3 cars.",
    type: "sale",
    propertyType: "villa",
    price: 45000000,
    city: "Mumbai",
    locality: "Bandra West",
    bedrooms: 4,
    bathrooms: 5,
    areaSqft: 4200,
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "Available",
    verificationStatus: "Approved",
    isVerified: true,
  },
  {
    agentId: agent2Id,
    title: "Premium 3BHK Highrise with Lake View",
    description:
      "Fully furnished 3BHK luxury highrise apartment on the 24th floor overlooking the serene Durgam Cheruvu lake. Includes premium amenities, gym, and squash court.",
    type: "rent",
    propertyType: "apartment",
    price: 65000,
    city: "Hyderabad",
    locality: "Hitec City",
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2100,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "Available",
    verificationStatus: "Approved",
    isVerified: true,
  },
  {
    agentId: agent1Id,
    title: "Elegant Independent House with Private Garden",
    description:
      "Charming multi-level 4BHK independent duplex house with solar power setup, servant quarters, organic rooftop garden, and peaceful residential neighborhood.",
    type: "sale",
    propertyType: "independent-house",
    price: 24000000,
    city: "Bangalore",
    locality: "Koramangala",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3400,
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "Under Negotiation",
    verificationStatus: "Approved",
    isVerified: true,
  },
  {
    agentId: agent2Id,
    title: "Modern Grade-A Commercial Office Suite",
    description:
      "Ready-to-move plug-and-play boutique commercial office space in prime business district. Includes reception, conference rooms, executive cabins, and cafeteria.",
    type: "rent",
    propertyType: "commercial",
    price: 220000,
    city: "Mumbai",
    locality: "BKC",
    bedrooms: 0,
    bathrooms: 2,
    areaSqft: 2900,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "Available",
    verificationStatus: "Approved",
    isVerified: true,
  },
  {
    agentId: agent1Id,
    title: "Scenic 2BHK Garden Apartment in Green Enclave",
    description:
      "Peaceful and serene 2BHK apartment with expansive balconies overlooking lush trees, jogging track, children's park, and multi-cuisine supermarket on campus.",
    type: "rent",
    propertyType: "apartment",
    price: 32000,
    city: "Pune",
    locality: "Koregaon Park",
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1150,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502005229762-ee10234b7214?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "Available",
    verificationStatus: "Approved",
    isVerified: true,
  },
  {
    agentId: agent2Id,
    title: "Premium BDA-Approved Villa Plot in Gated Township",
    description:
      "Corner residential plot in a prime gated township with 40-ft wide asphalt roads, underground cabling, water connection, and 24-hour manned security.",
    type: "sale",
    propertyType: "plot",
    price: 7200000,
    city: "Bangalore",
    locality: "Devanahalli",
    bedrooms: 0,
    bathrooms: 0,
    areaSqft: 2400,
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "Available",
    verificationStatus: "Approved",
    isVerified: true,
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully to MongoDB.");

    const createdUsers = {};

    for (const u of sampleUsers) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        const passwordHash = await bcrypt.hash(u.password, 10);
        existing = await User.create({
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          phone: u.phone,
          isVerified: u.isVerified,
        });
        console.log(`Created user: ${u.email} (${u.role})`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
      createdUsers[u.email] = existing;
    }

    const agent1 = createdUsers["rahul.agent@estatehub.com"];
    const agent2 = createdUsers["priya.agent@estatehub.com"];

    const propertiesToInsert = sampleProperties(agent1._id, agent2._id);

    let insertedCount = 0;
    for (const p of propertiesToInsert) {
      const existingProp = await Property.findOne({ title: p.title, city: p.city });
      if (!existingProp) {
        await Property.create(p);
        insertedCount++;
      }
    }

    console.log(`Inserted ${insertedCount} new sample properties.`);
    console.log("\n=======================================================");
    console.log("             SAMPLE ACCOUNTS READY FOR DEMO            ");
    console.log("=======================================================");
    console.log("Admin:   admin@estatehub.com       Password: AdminPass123!");
    console.log("Agent 1: rahul.agent@estatehub.com Password: AgentPass123!");
    console.log("Agent 2: priya.agent@estatehub.com Password: AgentPass123!");
    console.log("Buyer:   buyer@estatehub.com       Password: BuyerPass123!");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();

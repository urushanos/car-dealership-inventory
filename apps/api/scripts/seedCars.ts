
import dns from 'node:dns';

try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch {
  // Ignore in environments where custom DNS servers cannot be set
}

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Vehicle } from '../src/models/Vehicle.js';

dotenv.config();

export async function seedCars() {
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI is not defined in the environment variables.'
      );
    }

    await mongoose.connect(mongoUri);
  }

  try {
    const sampleVehicles = [
      { make: 'Honda', model: 'City', category: 'Sedan', year: 2024, price: 14500, quantity: 4 },
      { make: 'Hyundai', model: 'Creta', category: 'SUV', year: 2025, price: 22000, quantity: 6 },
      { make: 'Maruti Suzuki', model: 'Swift', category: 'Hatchback', year: 2024, price: 9500, quantity: 8 },
      { make: 'Tata', model: 'Nexon', category: 'SUV', year: 2025, price: 16500, quantity: 5 },
      { make: 'Kia', model: 'Seltos', category: 'SUV', year: 2024, price: 21000, quantity: 3 },
      { make: 'Toyota', model: 'Camry', category: 'Sedan', year: 2025, price: 35000, quantity: 2 },
      { make: 'Mahindra', model: 'XUV700', category: 'SUV', year: 2025, price: 28000, quantity: 4 },
      { make: 'Volkswagen', model: 'Virtus', category: 'Sedan', year: 2024, price: 19000, quantity: 3 },
      { make: 'Skoda', model: 'Kushaq', category: 'SUV', year: 2025, price: 18500, quantity: 5 },
      { make: 'Hyundai', model: 'i20', category: 'Hatchback', year: 2024, price: 11000, quantity: 7 },
      { make: 'Tata', model: 'Harrier', category: 'SUV', year: 2025, price: 26000, quantity: 2 },
      { make: 'Honda', model: 'Amaze', category: 'Sedan', year: 2024, price: 12000, quantity: 4 },
      { make: 'Kia', model: 'Carens', category: 'MUV', year: 2025, price: 20000, quantity: 3 },
      { make: 'Mahindra', model: 'Thar', category: 'SUV', year: 2025, price: 23000, quantity: 2 },
      { make: 'Toyota', model: 'Innova Hycross', category: 'MUV', year: 2025, price: 32000, quantity: 3 },
    ];

    // Read existing VINs to avoid duplicates.
    const existingVins = new Set(
      (await Vehicle.distinct('vin')).map((vin) => String(vin).toUpperCase())
    );

    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';

    function generateVin(): string {
      let vin = '';

      for (let i = 0; i < 17; i++) {
        vin += chars[Math.floor(Math.random() * chars.length)];
      }

      return vin;
    }

    const vehicles = sampleVehicles.map((vehicle) => {
      let vin: string;

      do {
        vin = generateVin();
      } while (existingVins.has(vin));

      existingVins.add(vin);

      return {
        ...vehicle,
        vin,
        status: 'available' as const,
      };
    });

    const insertedVehicles = await Vehicle.insertMany(vehicles);

    console.log(
      `[SeedCars] Successfully seeded ${insertedVehicles.length} vehicles.`
    );

    return insertedVehicles;
  } finally {
    if (!isConnected && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/seedCars.ts') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/seedCars.js');

if (isDirectRun) {
  seedCars()
    .then(() => {
      console.log('[SeedCars] Seeding completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SeedCars] Seeding failed:', err);
      process.exit(1);
    });
}

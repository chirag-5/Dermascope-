import Dermatologist from '../models/Dermatologist.js';
import { logDebug } from '../utils/logger.js';
import { countDermatologists } from '../services/dermatologist.service.js';

const SAMPLE_DERMATOLOGISTS = [
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-SKIN-1001',
    clinicName: 'Glow Skin Clinic',
    specialties: ['skin'],
    rating: 4.9,
    availability: 'available',
    consultationPrice: 800,
    isVerified: true,
  },
  {
    name: 'Dr. Arjun Mehta',
    email: 'arjun.mehta@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-HAIR-1002',
    clinicName: 'Hair Revival Center',
    specialties: ['hair'],
    rating: 4.7,
    availability: 'available',
    consultationPrice: 950,
    isVerified: true,
  },
  {
    name: 'Dr. Ananya Reddy',
    email: 'ananya.reddy@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-SKIN-1003',
    clinicName: 'Clear Complexion Dermatology',
    specialties: ['skin', 'hair'],
    rating: 4.8,
    availability: 'limited',
    consultationPrice: 1200,
    isVerified: true,
  },
  {
    name: 'Dr. Vikram Singh',
    email: 'vikram.singh@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-SKIN-1004',
    clinicName: 'Urban Derma Care',
    specialties: ['skin'],
    rating: 4.5,
    availability: 'available',
    consultationPrice: 700,
    isVerified: true,
  },
  {
    name: 'Dr. Meera Iyer',
    email: 'meera.iyer@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-HAIR-1005',
    clinicName: 'Scalp & Strand Institute',
    specialties: ['hair'],
    rating: 4.6,
    availability: 'available',
    consultationPrice: 850,
    isVerified: true,
  },
  {
    name: 'Dr. Rohan Kapoor',
    email: 'rohan.kapoor@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-SKIN-1006',
    clinicName: 'Kapoor Skin Solutions',
    specialties: ['skin', 'hair'],
    rating: 4.4,
    availability: 'limited',
    consultationPrice: 1100,
    isVerified: true,
  },
  {
    name: 'Dr. Sana Khan',
    email: 'sana.khan@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-SKIN-1007',
    clinicName: 'Radiance Dermatology',
    specialties: ['skin'],
    rating: 4.3,
    availability: 'unavailable',
    consultationPrice: 900,
    isVerified: true,
  },
  {
    name: 'Dr. Aditya Nair',
    email: 'aditya.nair@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-HAIR-1008',
    clinicName: 'Nair Hair & Scalp Clinic',
    specialties: ['hair'],
    rating: 4.2,
    availability: 'available',
    consultationPrice: 750,
    isVerified: true,
  },
  {
    name: 'Dr. Kavya Desai',
    email: 'kavya.desai@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-SKIN-1009',
    clinicName: 'Desai Derma Studio',
    specialties: ['skin', 'hair'],
    rating: 4.8,
    availability: 'available',
    consultationPrice: 1000,
    isVerified: true,
  },
  {
    name: 'Dr. Harish Patel',
    email: 'harish.patel@dermascope.demo',
    password: 'demo123456',
    licenseNumber: 'DL-SKIN-1010',
    clinicName: 'Patel Skin & Hair Care',
    specialties: ['skin', 'hair'],
    rating: 4.1,
    availability: 'limited',
    consultationPrice: 650,
    isVerified: true,
  },
];

export const seedDermatologistsIfEmpty = async () => {
  const count = await countDermatologists();

  if (count > 0) {
    return;
  }

  for (const dermatologist of SAMPLE_DERMATOLOGISTS) {
    await Dermatologist.create(dermatologist);
  }

  logDebug(`[Seed] Inserted ${SAMPLE_DERMATOLOGISTS.length} sample dermatologists.`);
};

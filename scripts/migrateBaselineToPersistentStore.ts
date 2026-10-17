import fs from 'fs';
import path from 'path';
import {
  initialPets,
  initialOwners,
  initialVisits,
  initialAppointments,
  initialClinicQueues,
  initialInvoices,
  initialBoardingRecords,
  initialPetShopProducts,
  initialPetShopSuppliers,
  initialLoyaltyMembers,
  initialSurgeryOperations,
  initialGroomingStyles,
  initialGroomingPortfolio,
  initialClinicProfile,
  initialAccessMatrix,
} from '../src/data/mockDatabase';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
const STORE_PATH = path.resolve(DATA_DIR, 'clinic_store.json');

async function migrate() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  // 1. Read existing store
  let existingStore: any = { initialized: true };
  if (fs.existsSync(STORE_PATH)) {
    try {
      existingStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    } catch (e) {
      console.warn('Could not read existing store, creating fresh.');
    }
  }

  // 2. Backup current store before any change
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.resolve(BACKUPS_DIR, `clinic_store_backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(existingStore, null, 2), 'utf-8');
  console.log(`[Backup] Current database backed up to: ${backupFile}`);

  // 3. Populate empty collections with master data
  const updatedStore = {
    ...existingStore,
    initialized: true,
    patients: existingStore.patients?.length ? existingStore.patients : initialPets,
    owners: existingStore.owners?.length ? existingStore.owners : initialOwners,
    visits: existingStore.visits?.length ? existingStore.visits : initialVisits,
    appointments: existingStore.appointments?.length ? existingStore.appointments : initialAppointments,
    queues: existingStore.queues?.length ? existingStore.queues : initialClinicQueues,
    invoices: existingStore.invoices?.length ? existingStore.invoices : initialInvoices,
    boarding: existingStore.boarding?.length ? existingStore.boarding : initialBoardingRecords,
    products: existingStore.products?.length ? existingStore.products : initialPetShopProducts,
    suppliers: existingStore.suppliers?.length ? existingStore.suppliers : initialPetShopSuppliers,
    loyaltyMembers: existingStore.loyaltyMembers?.length ? existingStore.loyaltyMembers : initialLoyaltyMembers,
    surgerySessions: existingStore.surgerySessions?.length ? existingStore.surgerySessions : initialSurgeryOperations,
    groomingStyles: existingStore.groomingStyles?.length ? existingStore.groomingStyles : initialGroomingStyles,
    groomingPortfolio: existingStore.groomingPortfolio?.length ? existingStore.groomingPortfolio : initialGroomingPortfolio,
    clinicProfile: existingStore.clinicProfile?.clinicName ? existingStore.clinicProfile : initialClinicProfile,
    accessMatrix: existingStore.accessMatrix?.roles ? existingStore.accessMatrix : initialAccessMatrix,
  };

  // 4. Save to disk atomically
  const tempPath = `${STORE_PATH}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(updatedStore, null, 2), 'utf-8');
  fs.renameSync(tempPath, STORE_PATH);

  console.log('[Success] Database successfully migrated to persistent store:');
  console.log(`- Patients: ${updatedStore.patients.length}`);
  console.log(`- Owners: ${updatedStore.owners.length}`);
  console.log(`- Visits: ${updatedStore.visits.length}`);
  console.log(`- Appointments: ${updatedStore.appointments.length}`);
  console.log(`- Queues: ${updatedStore.queues.length}`);
  console.log(`- Products: ${updatedStore.products.length}`);
}

migrate().catch((err) => {
  console.error('[Error] Migration failed:', err);
  process.exit(1);
});

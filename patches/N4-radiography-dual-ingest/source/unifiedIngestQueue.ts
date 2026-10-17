/**
 * Unified Ingest Queue for Mehregan Clinic Radiography
 * Merges images from both Windows 7 File Bridge (P1.6 Samba/HTA)
 * and FUJIFILM FCR PRIMA T2 DICOM Store SCP (Orthanc).
 * Deduplicates records using unique Patient ID / Accession Number.
 */

export interface IngestItem {
  id: string;
  source: 'file_bridge' | 'dicom_scp' | 'merged';
  patientId: string; // Clinic Record Number (e.g., "P-1044")
  patientName?: string;
  species?: string;
  studyDate: string;
  modality: 'CR' | 'DX';
  sopInstanceUid?: string;
  studyInstanceUid?: string;
  studyDescription?: string;
  seriesNumber?: number;
  instanceNumber?: number;
  fcrImageId?: string;
  exposureUnitType?: string; // TOSHIBA KCD-10M-7 or FCR Console
  file?: string;
  preview?: string;
  previewUrl?: string;
  imagePathOrUrl?: string;
  contentHash?: string;
  receivedAt: string;
  status: 'pending' | 'processed' | 'merged';
}

export class UnifiedIngestQueue {
  private queue: Map<string, IngestItem> = new Map();
  private sopIndex: Map<string, string> = new Map();
  private hashIndex: Map<string, string> = new Map();
  private patientIndex: Map<string, string> = new Map();

  /**
   * Enqueue a new incoming radiograph from either DICOM SCP or File Bridge.
   * Deduplicates primarily by SOPInstanceUID, secondarily by Content Hash,
   * and tertiarily by (Patient ID + Study Date).
   * Updates/merges without creating duplicate entries.
   */
  public enqueue(item: Omit<IngestItem, 'id' | 'receivedAt' | 'status'> & { id?: string }): { item: IngestItem; isDuplicate: boolean } {
    const patientKey = this.generatePatientKey(item.patientId, item.studyDate);
    const sopKey = item.sopInstanceUid ? `sop:${item.sopInstanceUid.trim()}` : null;
    const hashKey = item.contentHash ? `hash:${item.contentHash.trim()}` : null;

    // Check existing match
    let existingMainKey: string | undefined;
    if (sopKey && this.sopIndex.has(sopKey)) {
      existingMainKey = this.sopIndex.get(sopKey);
    } else if (hashKey && this.hashIndex.has(hashKey)) {
      existingMainKey = this.hashIndex.get(hashKey);
    } else if (this.patientIndex.has(patientKey)) {
      existingMainKey = this.patientIndex.get(patientKey);
    }

    if (existingMainKey && this.queue.has(existingMainKey)) {
      const existing = this.queue.get(existingMainKey)!;
      // Merge DICOM & File Bridge metadata
      existing.status = 'merged';
      if (item.source && existing.source !== item.source) {
        existing.source = 'merged';
      }
      if (item.sopInstanceUid && !existing.sopInstanceUid) existing.sopInstanceUid = item.sopInstanceUid;
      if (item.studyInstanceUid && !existing.studyInstanceUid) existing.studyInstanceUid = item.studyInstanceUid;
      if (item.studyDescription && !existing.studyDescription) existing.studyDescription = item.studyDescription;
      if (item.seriesNumber && !existing.seriesNumber) existing.seriesNumber = item.seriesNumber;
      if (item.instanceNumber && !existing.instanceNumber) existing.instanceNumber = item.instanceNumber;
      if (item.fcrImageId && !existing.fcrImageId) existing.fcrImageId = item.fcrImageId;
      if (item.exposureUnitType && !existing.exposureUnitType) existing.exposureUnitType = item.exposureUnitType;
      if (item.patientName && (!existing.patientName || existing.patientName === 'بیمار بدون نام')) existing.patientName = item.patientName;
      if (item.file && !existing.file) existing.file = item.file;
      if (item.preview && !existing.preview) existing.preview = item.preview;
      if (item.previewUrl && !existing.previewUrl) existing.previewUrl = item.previewUrl;
      if (item.contentHash && !existing.contentHash) existing.contentHash = item.contentHash;

      // Update secondary indices
      if (sopKey) this.sopIndex.set(sopKey, existingMainKey);
      if (hashKey) this.hashIndex.set(hashKey, existingMainKey);
      this.patientIndex.set(patientKey, existingMainKey);

      return { item: existing, isDuplicate: true };
    }

    const mainKey = sopKey || hashKey || `queue:${patientKey}_${Date.now()}`;
    const newItem: IngestItem = {
      ...item,
      id: item.id || (item.sopInstanceUid ? `rad-${item.sopInstanceUid}` : `rad-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      receivedAt: new Date().toISOString(),
      status: 'pending',
    };

    this.queue.set(mainKey, newItem);
    if (sopKey) this.sopIndex.set(sopKey, mainKey);
    if (hashKey) this.hashIndex.set(hashKey, mainKey);
    this.patientIndex.set(patientKey, mainKey);

    return { item: newItem, isDuplicate: false };
  }

  public getQueue(): IngestItem[] {
    return Array.from(this.queue.values());
  }

  public getByPatientId(patientId: string): IngestItem[] {
    return Array.from(this.queue.values()).filter(i => i.patientId === patientId);
  }

  public clear(): void {
    this.queue.clear();
    this.sopIndex.clear();
    this.hashIndex.clear();
    this.patientIndex.clear();
  }

  private generatePatientKey(patientId: string, studyDate: string): string {
    const normalizedId = String(patientId || 'UNKNOWN').trim().toUpperCase();
    const normalizedDate = studyDate ? studyDate.split('T')[0] : 'undated';
    return `${normalizedId}_${normalizedDate}`;
  }
}

export const unifiedIngestQueue = new UnifiedIngestQueue();

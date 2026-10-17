/**
 * Orthanc DICOM Adapter
 * Maps incoming Orthanc REST instances and DICOM tags to the
 * standard Mehregan Clinic Radiography format.
 */

export interface DicomTags {
  SOPInstanceUID: string;
  StudyInstanceUID?: string;
  PatientID: string;
  PatientName?: string;
  StudyDate?: string;
  Modality?: string;
  StudyDescription?: string;
  SeriesDescription?: string;
  SeriesNumber?: string | number;
  InstanceNumber?: string | number;
  Manufacturer?: string;
  ManufacturerModelName?: string;
  DeviceSerialNumber?: string;
  BodyPartExamined?: string;
}

export interface OrthancInstancePayload {
  ID: string; // Orthanc UUID
  MainDicomTags?: Partial<DicomTags>;
  PatientMainDicomTags?: Partial<DicomTags>;
  FileUuid?: string;
  FileSize?: number;
}

export function mapOrthancInstanceToClinicRadiograph(payload: OrthancInstancePayload) {
  const tags = {
    ...(payload.PatientMainDicomTags || {}),
    ...(payload.MainDicomTags || {}),
  };

  const patientId = tags.PatientID || 'UNKNOWN_PATIENT';
  const sopInstanceUid = tags.SOPInstanceUID || payload.ID;
  const studyDate = tags.StudyDate || new Date().toISOString().split('T')[0];
  const patientName = tags.PatientName || 'مراجع رادیوگرافی';

  return {
    id: `rad-dicom-${payload.ID.substring(0, 8)}`,
    source: 'dicom_scp' as const,
    patientId,
    patientName,
    studyDate,
    modality: (tags.Modality === 'DX' ? 'DX' : 'CR') as 'CR' | 'DX',
    sopInstanceUid,
    studyInstanceUid: tags.StudyInstanceUID,
    studyDescription: tags.StudyDescription || tags.SeriesDescription || '',
    seriesNumber: tags.SeriesNumber ? Number(tags.SeriesNumber) : 1,
    instanceNumber: tags.InstanceNumber ? Number(tags.InstanceNumber) : 1,
    fcrImageId: `FCR-${payload.ID.substring(0, 6).toUpperCase()}`,
    exposureUnitType: 'TOSHIBA KCD-10M-7 / FUJIFILM CR-IR 392',
    imagePathOrUrl: `/api/radiography/dicom/instances/${payload.ID}/preview.jpg`,
    status: 'pending' as const,
  };
}

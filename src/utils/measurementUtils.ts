// Measurement utilities for Overplast Clinical System

export const GARMENT_FIELDS: Record<string, { id: string; label: string; placeholder: string }[]> = {
  'Face Mask & Chin Binder': [
    { id: 'around_neck', label: 'Around neck', placeholder: 'e.g., 38 cm' },
    { id: 'around_head', label: 'Around head', placeholder: 'e.g., 54 cm' },
    { id: 'around_chin', label: 'Around chin', placeholder: 'e.g., 32 cm' },
    { id: 'neck_length', label: 'Neck length', placeholder: 'e.g., 12 cm' }
  ],
  'Connecting Sleeves': [
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 42 cm' },
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'open_end', label: 'Open End', placeholder: 'e.g., 18 cm' },
    { id: 'close_end', label: 'Close End', placeholder: 'e.g., 14 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'Arm sleeve Right Hand': [
    { id: 'arm_pit', label: 'Open End', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'wrist', label: 'Close End', placeholder: 'e.g., 16 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'Arm sleeve Left Hand': [
    { id: 'arm_pit', label: 'Open End', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'wrist', label: 'Close End', placeholder: 'e.g., 16 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'Connecting Sleeves/Arm Sleeve': [
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 42 cm' },
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'open_end', label: 'Open End', placeholder: 'e.g., 18 cm' },
    { id: 'close_end', label: 'Close End', placeholder: 'e.g., 14 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'All Jacket': [
    { id: 'neck_around', label: 'Neck around', placeholder: 'e.g., 36 cm' },
    { id: 'neck_length', label: 'Neck length', placeholder: 'e.g., 8 cm' },
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 44 cm' },
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 32 cm' },
    { id: 'arm_open_end', label: 'Arm open end', placeholder: 'e.g., 20 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 26 cm' },
    { id: 'arm_close_end', label: 'Arm close end', placeholder: 'e.g., 16 cm' },
    { id: 'arm_total_length', label: 'Arm total length', placeholder: 'e.g., 62 cm' },
    { id: 'chest', label: 'Chest', placeholder: 'e.g., 98 cm' },
    { id: 'diapharm', label: 'Diapharm', placeholder: 'e.g., 85 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 90 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 88 cm' },
    { id: 'total_length', label: 'Total length', placeholder: 'e.g., 70 cm' }
  ],
  'All Gloves/Glove With Sleeve': [
    { id: 'palm', label: 'Palm', placeholder: 'e.g., 20 cm' },
    { id: 'wrist', label: 'Wrist', placeholder: 'e.g., 16 cm' },
    { id: 'thumb', label: 'Thumb', placeholder: 'e.g., 5.5 cm' },
    { id: 'index_finger', label: 'Index finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'middle_finger', label: 'Middle finger', placeholder: 'e.g., 8 cm' },
    { id: 'ring_finger', label: 'Ring finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'little_finger', label: 'Little finger', placeholder: 'e.g., 6 cm' },
    { id: 'total_len_medal_to_scar', label: 'Total length middle finger to end of scar', placeholder: 'e.g., 35 cm' }
  ],
  'Glove With Sleeve': [
    { id: 'palm', label: 'Palm', placeholder: 'e.g., 20 cm' },
    { id: 'wrist', label: 'Wrist', placeholder: 'e.g., 16 cm' },
    { id: 'thumb', label: 'Thumb', placeholder: 'e.g., 5.5 cm' },
    { id: 'index_finger', label: 'Index finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'middle_finger', label: 'Middle finger', placeholder: 'e.g., 8 cm' },
    { id: 'ring_finger', label: 'Ring finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'little_finger', label: 'Little finger', placeholder: 'e.g., 6 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'close_end', label: 'Close end', placeholder: 'e.g., 18 cm' },
    { id: 'len_middle_finger_to_wrist', label: 'Length middle finger to wrist', placeholder: 'e.g., 18 cm' },
    { id: 'len_wrist_to_end_of_scar', label: 'Length wrist to end of scar', placeholder: 'e.g., 35 cm' }
  ],
  'Sports Bra': [
    { id: 'diaphrarm', label: 'Diaphrarm', placeholder: 'e.g., 75 cm' },
    { id: 'chest', label: 'Chest', placeholder: 'e.g., 85 cm' },
    { id: 'armpit', label: 'Armpit', placeholder: 'e.g., 38 cm' },
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 36 cm' },
    { id: 'total_length', label: 'Total length', placeholder: 'e.g., 32 cm' }
  ],
  'Belly Binder': [
    { id: 'diaphrarm', label: 'Diaphrom', placeholder: 'e.g., 51 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 53 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 54 cm' },
    { id: 'hips', label: 'Hips', placeholder: 'e.g., 58 cm' },
    { id: 'open_end_thigh', label: 'Open End', placeholder: 'e.g., 35 cm' },
    { id: 'close_end_thigh', label: 'Close End (Leg end)', placeholder: 'e.g., 25 cm' },
    { id: 'len_diaphragm_to_waist', label: 'Length Diaphrom to Waist', placeholder: 'e.g., 18 cm' },
    { id: 'len_waist_to_close_end', label: 'Waist to Close End', placeholder: 'e.g., 44 cm' }
  ],
  'Belly Belt': [
    { id: 'diaphrarm', label: 'Diaphrom', placeholder: 'e.g., 75 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 80 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 78 cm' },
    { id: 'len_diaphragm_to_waist', label: 'Width diapharm to waist', placeholder: 'e.g., 25 cm' }
  ],
  'All Trouser': [
    { id: 'diaphrarm', label: 'Diaphrarm', placeholder: 'e.g., 96 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 98 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 98 cm' },
    { id: 'hips', label: 'Hips', placeholder: 'e.g., 104 cm' },
    { id: 'open_end_thigh', label: 'Open end thigh', placeholder: 'e.g., 56 cm' },
    { id: 'close_end_thigh', label: 'Close end thigh', placeholder: 'e.g., 46 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 42 cm' },
    { id: 'ankle', label: 'Ankle', placeholder: 'e.g., 25 cm' },
    { id: 'len_diaphragm_to_waist', label: 'length diaphragm to waist', placeholder: 'e.g., 20 cm' },
    { id: 'len_waist_to_ankle', label: 'Length waist to ankle', placeholder: 'e.g., 86 cm' },
    { id: 'total_length', label: 'Total Length', placeholder: 'e.g., 91 cm' }
  ],
  'All Leg Sleeves': [
    { id: 'open_end', label: 'Open end', placeholder: 'e.g., 45 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 35 cm' },
    { id: 'close_end', label: 'Close end', placeholder: 'e.g., 22 cm' },
    { id: 'total_length', label: 'Total length', placeholder: 'e.g., 68 cm' }
  ],
  'All Socks': [
    { id: 'feet', label: 'Feet', placeholder: 'e.g., 24 cm' },
    { id: 'ankle', label: 'Ankle', placeholder: 'e.g., 22 cm' },
    { id: 'above_ankle_open_end', label: 'Above ankle open end', placeholder: 'e.g., 26 cm' },
    { id: 'close_end', label: 'Close end', placeholder: 'e.g., 20 cm' },
    { id: 'feet_length', label: 'Feet length', placeholder: 'e.g., 25 cm' },
    { id: 'len_heel_to_close_end', label: 'Length heel to close end', placeholder: 'e.g., 18 cm' }
  ],
  'Body Shaper': [
    { id: 'neck_around', label: 'Neck around', placeholder: 'e.g., 36 cm' },
    { id: 'neck_length', label: 'Neck length', placeholder: 'e.g., 8 cm' },
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 44 cm' },
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 32 cm' },
    { id: 'arm_open_end', label: 'Arm open end', placeholder: 'e.g., 20 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 26 cm' },
    { id: 'arm_close_end', label: 'Arm close end', placeholder: 'e.g., 16 cm' },
    { id: 'arm_total_length', label: 'Arm total length', placeholder: 'e.g., 62 cm' },
    { id: 'chest', label: 'Chest', placeholder: 'e.g., 98 cm' },
    { id: 'diapharm', label: 'Diapharm', placeholder: 'e.g., 85 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 90 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 88 cm' },
    { id: 'hips', label: 'Hips', placeholder: 'e.g., 104 cm' },
    { id: 'open_end_thigh', label: 'Open end thigh', placeholder: 'e.g., 56 cm' },
    { id: 'close_end_thigh', label: 'Close end thigh', placeholder: 'e.g., 46 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 42 cm' },
    { id: 'ankle', label: 'Ankle', placeholder: 'e.g., 25 cm' },
    { id: 'length_diaphragm_to_waist', label: 'length diaphragm to waist', placeholder: 'e.g., 20 cm' },
    { id: 'length_waist_to_ankle', label: 'Length waist to ankle', placeholder: 'e.g., 86 cm' },
    { id: 'total_length', label: 'Total Length', placeholder: 'e.g., 91 cm' }
  ]
};

export const BOTH_HAND_GLOVE_WITH_SLEEVE_FIELDS: { id: string; label: string; placeholder: string }[] = [
  { id: 'rh_palm', label: 'Right Hand Palm', placeholder: 'e.g., 20 cm' },
  { id: 'lh_palm', label: 'Left Hand Palm', placeholder: 'e.g., 20 cm' },
  { id: 'rh_wrist', label: 'Right Hand Wrist', placeholder: 'e.g., 16 cm' },
  { id: 'lh_wrist', label: 'Left Hand Wrist', placeholder: 'e.g., 16 cm' },
  { id: 'rh_thumb', label: 'Right Hand Thumb', placeholder: 'e.g., 5.5 cm' },
  { id: 'lh_thumb', label: 'Left Hand Thumb', placeholder: 'e.g., 5.5 cm' },
  { id: 'rh_index_finger', label: 'Right Hand Index finger', placeholder: 'e.g., 7.5 cm' },
  { id: 'lh_index_finger', label: 'Left Hand Index finger', placeholder: 'e.g., 7.5 cm' },
  { id: 'rh_middle_finger', label: 'Right Hand Middle finger', placeholder: 'e.g., 8 cm' },
  { id: 'lh_middle_finger', label: 'Left Hand Middle finger', placeholder: 'e.g., 8 cm' },
  { id: 'rh_ring_finger', label: 'Right Hand Ring finger', placeholder: 'e.g., 7.5 cm' },
  { id: 'lh_ring_finger', label: 'Left Hand Ring finger', placeholder: 'e.g., 7.5 cm' },
  { id: 'rh_little_finger', label: 'Right Hand Little finger', placeholder: 'e.g., 6 cm' },
  { id: 'lh_little_finger', label: 'Left Hand Little finger', placeholder: 'e.g., 6 cm' },
  { id: 'rh_elbow', label: 'Right Hand Elbow', placeholder: 'e.g., 24 cm' },
  { id: 'lh_elbow', label: 'Left Hand Elbow', placeholder: 'e.g., 24 cm' },
  { id: 'rh_close_end', label: 'Right Hand Close end', placeholder: 'e.g., 18 cm' },
  { id: 'lh_close_end', label: 'Left Hand Close end', placeholder: 'e.g., 18 cm' },
  { id: 'rh_len_middle_finger_to_wrist', label: 'Right Hand Length middle finger to wrist', placeholder: 'e.g., 18 cm' },
  { id: 'lh_len_middle_finger_to_wrist', label: 'Left Hand Length middle finger to wrist', placeholder: 'e.g., 18 cm' },
  { id: 'rh_len_wrist_to_end_of_scar', label: 'Right Hand Length wrist to end of scar', placeholder: 'e.g., 35 cm' },
  { id: 'lh_len_wrist_to_end_of_scar', label: 'Left Hand Length wrist to end of scar', placeholder: 'e.g., 35 cm' }
];

export const BOTH_HAND_GLOVES_FIELDS: { id: string; label: string; placeholder: string }[] = [
  { id: 'rh_palm', label: 'Right Hand Palm', placeholder: 'e.g., 20 cm' },
  { id: 'lh_palm', label: 'Left Hand Palm', placeholder: 'e.g., 20 cm' },
  { id: 'rh_wrist', label: 'Right Hand Wrist', placeholder: 'e.g., 16 cm' },
  { id: 'lh_wrist', label: 'Left Hand Wrist', placeholder: 'e.g., 16 cm' },
  { id: 'rh_thumb', label: 'Right Hand Thumb', placeholder: 'e.g., 5.5 cm' },
  { id: 'lh_thumb', label: 'Left Hand Thumb', placeholder: 'e.g., 5.5 cm' },
  { id: 'rh_index_finger', label: 'Right Hand Index finger', placeholder: 'e.g., 7.5 cm' },
  { id: 'lh_index_finger', label: 'Left Hand Index finger', placeholder: 'e.g., 7.5 cm' },
  { id: 'rh_middle_finger', label: 'Right Hand Middle finger', placeholder: 'e.g., 8 cm' },
  { id: 'lh_middle_finger', label: 'Left Hand Middle finger', placeholder: 'e.g., 8 cm' },
  { id: 'rh_ring_finger', label: 'Right Hand Ring finger', placeholder: 'e.g., 7.5 cm' },
  { id: 'lh_ring_finger', label: 'Left Hand Ring finger', placeholder: 'e.g., 7.5 cm' },
  { id: 'rh_little_finger', label: 'Right Hand Little finger', placeholder: 'e.g., 6 cm' },
  { id: 'lh_little_finger', label: 'Left Hand Little finger', placeholder: 'e.g., 6 cm' },
  { id: 'rh_total_len_medal_to_scar', label: 'Right Hand Total length middle finger to end of scar', placeholder: 'e.g., 35 cm' },
  { id: 'lh_total_len_medal_to_scar', label: 'Left Hand Total length middle finger to end of scar', placeholder: 'e.g., 35 cm' }
];

/**
 * Returns true if a key is a configuration option, note, or metadata (not a physical body measurement).
 */
export function isNonMeasurementKey(key: string): boolean {
  const k = key.trim().toLowerCase();
  const nonMeasurementKeys = [
    'color',
    'garment type',
    'garment_type',
    'hand selection',
    'zipper',
    'zipper location',
    'zipper_location',
    'fabric',
    'material',
    'silicone',
    'silicone option',
    'silicone_pasting',
    'silicone pasting',
    'compression',
    'compression force',
    'compression_force',
    'custom design notes',
    'custom_design_notes',
    'doctornotes',
    'doctor_notes',
    'doctor notes',
    'notes',
    'id',
    'patient_id',
    'patient_name',
    'patient name',
    'age',
    'gender',
    'date',
    'created_at',
    'hospital_name',
    'doctor_ref',
    'city',
    'address',
    'phone',
    'photos'
  ];

  return nonMeasurementKeys.includes(k);
}

export interface ExtractedAssessmentData {
  garmentType: string;
  handSelection?: string;
  color: string;
  silicone: string;
  compression: string;
  coreMeasurements: [string, string][];
  customDesignOptions: [string, string][];
  doctorNotes?: string;
  garmentNotes?: string;
  customDesignNotes?: string;
}

/**
 * Extracts and strictly separates Core Measurements from Custom Design Options
 * across all garment types and both-hand / single-hand variations.
 */
export function extractAssessmentMeasurements(assessment: any): ExtractedAssessmentData {
  const garmentTypeRaw = assessment.garment_type || assessment.type || 'N/A';
  const garmentType = garmentTypeRaw === 'All Gloves/Glove With Sleeve' ? 'Gloves' : garmentTypeRaw;
  const isGloveWithSleeve = garmentTypeRaw === 'Glove With Sleeve';
  const isGloves = garmentTypeRaw === 'All Gloves/Glove With Sleeve' || garmentTypeRaw.toLowerCase() === 'gloves';

  const subOptions: Record<string, any> = assessment.sub_options || assessment.subOptions || {};
  const measurementsRaw = assessment.measurements;

  const handSelection = subOptions['Hand Selection'] || subOptions['hand selection'] || subOptions['Hand selection'];

  // Check if both-hand glove measurements exist
  const hasBothHandKeys = Object.keys(subOptions).some(k => {
    const lk = k.toLowerCase();
    return lk.startsWith('left hand') || lk.startsWith('right hand') || lk.startsWith('lh_') || lk.startsWith('rh_');
  });
  const isBothHand = (isGloveWithSleeve || isGloves) && (handSelection === 'Both Hand Glove' || hasBothHandKeys);

  // Combine raw measurements into a key-value dictionary
  const rawMeasurementsDict: Record<string, string> = {};

  // 1. Load from sub_options first (primary clinical data input)
  Object.entries(subOptions).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '' && !isNonMeasurementKey(k)) {
      rawMeasurementsDict[k] = String(v).trim();
    }
  });

  // 2. Load from measurements array/object only if not already present or if not conflicting with both-hand
  if (Array.isArray(measurementsRaw)) {
    measurementsRaw.forEach((item: any) => {
      if (item && typeof item === 'object') {
        const k = item.label || item.name || item.id;
        const v = item.value;
        if (k && v !== undefined && v !== null && String(v).trim() !== '' && !isNonMeasurementKey(k)) {
          // If we have both hand measurements, skip stale generic single-hand entries
          if (isBothHand && (k === 'palm' || k === 'wrist' || k === 'thumb' || k === 'index_finger' || k === 'Palm' || k === 'Wrist' || k === 'Thumb' || k === 'Index finger')) {
            return;
          }
          if (!rawMeasurementsDict[k]) {
            rawMeasurementsDict[k] = String(v).trim();
          }
        }
      }
    });
  } else if (measurementsRaw && typeof measurementsRaw === 'object') {
    Object.entries(measurementsRaw).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '' && !isNonMeasurementKey(k)) {
        if (isBothHand && (k === 'palm' || k === 'wrist' || k === 'thumb' || k === 'index_finger' || k === 'Palm' || k === 'Wrist' || k === 'Thumb' || k === 'Index finger')) {
          return;
        }
        if (!rawMeasurementsDict[k]) {
          rawMeasurementsDict[k] = String(v).trim();
        }
      }
    });
  }

  // Determine standard expected fields in clinical display order
  let orderedFields: { id: string; label: string }[] = [];
  if (isGloveWithSleeve) {
    orderedFields = isBothHand ? BOTH_HAND_GLOVE_WITH_SLEEVE_FIELDS : GARMENT_FIELDS['Glove With Sleeve'];
  } else if (isGloves) {
    orderedFields = isBothHand ? BOTH_HAND_GLOVES_FIELDS : GARMENT_FIELDS['All Gloves/Glove With Sleeve'];
  } else {
    orderedFields = GARMENT_FIELDS[garmentTypeRaw] || [];
  }

  const coreMeasurements: [string, string][] = [];
  const processedKeys = new Set<string>();

  // Helper to match key in rawMeasurementsDict
  const findValue = (field: { id: string; label: string }) => {
    const targetId = field.id.toLowerCase();
    const targetLabel = field.label.toLowerCase();

    for (const [key, val] of Object.entries(rawMeasurementsDict)) {
      if (processedKeys.has(key)) continue;
      const lowerKey = key.toLowerCase();
      if (lowerKey === targetId || lowerKey === targetLabel) {
        processedKeys.add(key);
        return val;
      }
    }
    return null;
  };

  // Process predefined fields in precise clinical order
  orderedFields.forEach(field => {
    const val = findValue(field);
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      coreMeasurements.push([field.label, String(val).trim()]);
    }
  });

  // Also include any other measurements present in rawMeasurementsDict that weren't in orderedFields
  Object.entries(rawMeasurementsDict).forEach(([key, val]) => {
    if (!processedKeys.has(key) && val !== undefined && val !== null && String(val).trim() !== '') {
      processedKeys.add(key);
      coreMeasurements.push([key, String(val).trim()]);
    }
  });

  // Extract non-measurement Custom Design Options
  const customDesignOptions: [string, string][] = [];
  const color = subOptions['Color'] || subOptions['color'] || 'Standard';
  const silicone = assessment.silicone_pasting || assessment.siliconePasting || 'Without Silicone';
  const compression = assessment.compression || 'Moderate';

  // Any other custom design options in subOptions
  Object.entries(subOptions).forEach(([k, v]) => {
    const lk = k.toLowerCase();
    if (
      isNonMeasurementKey(k) &&
      lk !== 'color' &&
      lk !== 'garment type' &&
      lk !== 'custom design notes' &&
      lk !== 'doctornotes' &&
      lk !== 'doctor notes' &&
      lk !== 'notes' &&
      lk !== 'silicone' &&
      lk !== 'silicone option' &&
      lk !== 'silicone pasting' &&
      lk !== 'silicone_pasting' &&
      lk !== 'compression' &&
      lk !== 'compression force' &&
      v !== undefined &&
      v !== null &&
      String(v).trim() !== ''
    ) {
      customDesignOptions.push([k, String(v).trim()]);
    }
  });

  const doctorNotes = subOptions['doctorNotes'] || subOptions['doctor_notes'] || assessment.doctorNotes || assessment.doctor_notes || '';
  const garmentNotes = assessment.notes || '';
  const customDesignNotes = subOptions['Custom Design Notes'] || subOptions['custom_design_notes'] || '';

  return {
    garmentType,
    handSelection: handSelection || (isBothHand ? 'Both Hand Glove' : (isGloveWithSleeve || isGloves ? 'Right Hand Glove' : undefined)),
    color,
    silicone,
    compression,
    coreMeasurements,
    customDesignOptions,
    doctorNotes,
    garmentNotes,
    customDesignNotes
  };
}

/**
 * Builds standard, clean WhatsApp sharing text
 */
export function buildAssessmentWhatsAppText(params: {
  assessment: any;
  resolvedPhone?: string;
  resolvedAddress?: string;
  resolvedDoctorNotes?: string;
}): string {
  const { assessment, resolvedPhone, resolvedAddress, resolvedDoctorNotes } = params;
  const data = extractAssessmentMeasurements(assessment);

  let messageText = `🩺 *CLINICAL ASSESSMENT SUMMARY*\n\n`;

  messageText += `*👤 PATIENT DETAILS*\n`;
  messageText += `🟢 File ID: *${assessment.id || assessment.patientId || 'N/A'}*\n`;
  messageText += `🟢 Name: *${assessment.patient_name || assessment.name || 'N/A'}*\n`;
  if (resolvedPhone) {
    messageText += `🟢 Mob No: *${resolvedPhone}*\n`;
  }
  const ageVal = assessment.age && assessment.age > 0 ? `${assessment.age} Yrs` : 'N/A';
  messageText += `🟢 Age / Gender: *${ageVal} / ${assessment.gender || 'N/A'}*\n`;
  const dateVal = assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : (assessment.date || new Date().toLocaleDateString());
  messageText += `🟢 Date: *${dateVal}*\n`;
  if (resolvedAddress) {
    messageText += `🔵 *ADDRESS*\n`;
    messageText += `🔵 Address: *${resolvedAddress}*\n`;
  }
  messageText += `\n`;

  messageText += `*📦 GARMENT CONFIGURATION*\n`;
  messageText += `• Garment Type: *${data.garmentType}*\n`;
  messageText += `• Silicone Option: *${data.silicone}*\n`;
  messageText += `• Compression Force: *${data.compression}*\n`;
  messageText += `\n`;

  if (data.coreMeasurements.length > 0) {
    messageText += `*📐 CORE MEASUREMENTS*\n`;
    data.coreMeasurements.forEach(([label, val]) => {
      messageText += `• ${label}: *${val}*\n`;
    });
    messageText += `\n`;
  }

  messageText += `*✍️ CUSTOM DESIGN OPTIONS*\n`;
  messageText += `• Garment Type: *${data.garmentType}*\n`;
  if (data.handSelection) {
    messageText += `• Hand Selection: *${data.handSelection}*\n`;
  }
  messageText += `• Color: *${data.color}*\n`;
  data.customDesignOptions.forEach(([key, val]) => {
    if (key !== 'Hand Selection') {
      messageText += `• ${key}: *${val}*\n`;
    }
  });
  messageText += `\n`;

  const finalDoctorNotes = resolvedDoctorNotes || data.doctorNotes;
  if (finalDoctorNotes) {
    messageText += `🔴 *🩺 DOCTOR'S NOTES & CASE HISTORY*\n`;
    messageText += `🔴 "${finalDoctorNotes}"\n\n`;
  }

  if (data.garmentNotes) {
    messageText += `🔴 *📝 GARMENT CONFIGURATION NOTE*\n`;
    messageText += `🔴 "${data.garmentNotes}"\n\n`;
  }

  if (data.customDesignNotes) {
    messageText += `🔴 *✍️ CUSTOM DESIGN NOTES*\n`;
    messageText += `🔴 "${data.customDesignNotes}"\n\n`;
  }

  messageText += `*Generated via Overplast Live Calibration Portal*`;
  return messageText;
}

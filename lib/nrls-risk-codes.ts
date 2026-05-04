/*
  NRLS & HRMS on Cloud risk code master data, fiscal year 2565.
  Source: NRLS.pdf uploaded in this project.
  Do not edit codes/names manually unless replacing from an official NRLS source.
*/
export type NrlsRiskCodeSeed = { code: string; nameTh: string; nameEn: string | null; clinicalOrGeneral: "Clinical" | "General"; simpleCategory: string };

export const nrlsRiskCodes = [
  {
    "code": "CPS101",
    "nameTh": "ผ่าตัดผิดตำแหน่ง ผิดข้าง (Surgery or other invasive procedure performed on the wrong body part)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS102",
    "nameTh": "ผ่าตัดผิดคน (Surgery or other invasive procedure performed on the wrong patient)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS103",
    "nameTh": "ผ่าตัดผิดชนิด (Wrong surgical or other invasive procedure performed on a patient)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS104",
    "nameTh": "Wrong implant/prosthetic",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS105",
    "nameTh": "บาดเจ็บอวัยวะข้างเคียงระหว่างผ่าตัด (Internal organ injury or Accidental puncture or laceration)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS106",
    "nameTh": "Perioperative hemorrhage or hematoma",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS107",
    "nameTh": "ภาวะแทรกซ้อนอื่น ๆ ของผู้ป่วยระหว่างการผ่าตัดที่ป้องกันได้",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS108",
    "nameTh": "ผ่าตัดซ้ำโดยไม่ได้วางแผน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS109",
    "nameTh": "ความคาดเคลื่อนของการส่งผลชิ้นเนื้อ หรือสิ่งส่งตรวจอื่นในกระบวนการผ่าตัด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS110",
    "nameTh": "Intraoperative or immediately postoperative/post procedure death in an ASA PS I patient",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.1"
  },
  {
    "code": "CPS111",
    "nameTh": "SSI: Surgical Site Infection",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.2"
  },
  {
    "code": "CPS112",
    "nameTh": "Postoperative Acute Kidney Injury Requiring Dialysis",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.3"
  },
  {
    "code": "CPS113",
    "nameTh": "Postoperative Hip Fracture",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.3"
  },
  {
    "code": "CPS114",
    "nameTh": "Postoperative Respiratory failure",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.3"
  },
  {
    "code": "CPS115",
    "nameTh": "Postoperative Sepsis",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.3"
  },
  {
    "code": "CPS116",
    "nameTh": "Postoperative Wound dehiscence",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.3"
  },
  {
    "code": "CPS117",
    "nameTh": "ภาวะแทรกซ้อนอื่น ๆ ของผู้ป่วยหลังผ่าตัดที่ป้องกันได้",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.3"
  },
  {
    "code": "CPS118",
    "nameTh": "เกิดภาวะ Venous Thromboembolism (VTE) หลังผ่าตัด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1.4"
  },
  {
    "code": "CPS201",
    "nameTh": "เกิดภาวะแทรกซ้อนที่เกี่ยวข้องกับการระงับความรู้สึก",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S2"
  },
  {
    "code": "CPS202",
    "nameTh": "ภาวะหัวใจหยุดเต้นระหว่างผ่าตัดในผู้ป่วย ASA PS I, II",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S2"
  },
  {
    "code": "CPS203",
    "nameTh": "ใส่ท่อหายใจซ้ำภายใน 2 ชั่วโมงหลังการถอดท่อหายใจ (re-intubation within 2 hrs. after ex-tubation)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S2"
  },
  {
    "code": "CPS301",
    "nameTh": "สิ่งแวดล้อมในห้องผ่าตัดไม่ปลอดภัย",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S3.1"
  },
  {
    "code": "CPS302",
    "nameTh": "ไฟฟ้าสำรองไม่ทำงานภายในระยะเวลาที่กำหนดเมื่อไฟดับระหว่างผ่าตัด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S3.1"
  },
  {
    "code": "CPS303",
    "nameTh": "เครื่องมือ-อุปกรณ์สำหรับผ่าตัดไม่พร้อมใช้งาน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S3.2"
  },
  {
    "code": "CPS304",
    "nameTh": "ภาวะแทรกซ้อนจากเครื่องมือ/อุปกรณ์เกี่ยวกับการผ่าตัด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S3.2"
  },
  {
    "code": "CPS305",
    "nameTh": "เหตุการณ์ไม่พึงประสงค์ จากการไม่ปฏิบัติตามขั้นตอนกระบวนการดูแลผู้ป่วยที่มา รับการผ่าตัด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S3.3"
  },
  {
    "code": "CPS306",
    "nameTh": "การเลื่อนการผ่าตัดที่ไม่เร่งด่วนจากความไม่พร้อมหรือการประเมินไม่ครบถ้วน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S3.3"
  },
  {
    "code": "CPS307",
    "nameTh": "การมีอุปกรณ์หรือสิ่งตกค้างอื่นใดในร่างกายผู้ป่วย (Unintended retention of foreign object in a patient after surgery or other procedure)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S3.3"
  },
  {
    "code": "CPS308",
    "nameTh": "การปฏิบัติโดยไม่คำนึงถึงศักดิ์ศรีความเป็นมนุษย์และสิทธิผู้ป่วย",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S3.3"
  },
  {
    "code": "CPI101",
    "nameTh": "ไม่ล้างมือ/ล้างไม่เหมาะสมตามข้อบ่งชี้ของการทำความสะอาดมือ (5 moments for hand hygiene)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I1"
  },
  {
    "code": "CPI201",
    "nameTh": "CAUTI: Catheter Associated Urinary Tract Infection",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I2.1"
  },
  {
    "code": "CPI202",
    "nameTh": "VAP: Ventilator-Associated Pneumonia",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I2.2"
  },
  {
    "code": "CPI203",
    "nameTh": "CLABSI: Central Line-Associated Bloodstream Infection",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I2.3"
  },
  {
    "code": "CPI204",
    "nameTh": "การไม่ปฏิบัติตามแนวทางป้องกันการแพร่กระจายเชื้อก่อโรคในสถานพยาบาล Standard Precautions (ยกเว้นการล้างมือ)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I2"
  },
  {
    "code": "CPI301",
    "nameTh": "การเกิดระบาดโรคอุบัติใหม่ อุบัติซ้ำ",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I3"
  },
  {
    "code": "CPI302",
    "nameTh": "เกิดการระบาดของโรคที่ป้องกันได้ด้วยวัคซีน (Vaccine Preventable Disease) ภายในโรงพยาบาล",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I3"
  },
  {
    "code": "CPI303",
    "nameTh": "เกิดการระบาดของโรคติดต่ออื่น ๆ (Other Communication Disease) ภายใน โรงพยาบาล",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I3"
  },
  {
    "code": "CPI401",
    "nameTh": "การเกิดการติดเชื้อดื้อยา",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "I4"
  },
  {
    "code": "CPM101",
    "nameTh": "แพ้ยาซ้ำ",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1"
  },
  {
    "code": "CPM102",
    "nameTh": "ไม่มี/ไม่ปฏิบัติตาม Guideline ของการใช้ High Alert Drug",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1.1"
  },
  {
    "code": "CPM103",
    "nameTh": "ผู้ป่วยมีภาวะแทรกซ้อนที่ป้องกันได้จากการได้รับยาความเสี่ยงสูง",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1.1"
  },
  {
    "code": "CPM104",
    "nameTh": "Mis selection of a strong potassium containing solution",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1.1"
  },
  {
    "code": "CPM105",
    "nameTh": "แพ้ยา (ยกเว้น แพ้ยาซ้ำ)/ADE: Adverse Drug Events ที่มีความรุนแรงระดับ E ขึ้นไป",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1.2"
  },
  {
    "code": "CPM106",
    "nameTh": "ไม่มี/ไม่ปฏิบัติตาม Guideline ของการใช้ Fatal Drug",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1.3"
  },
  {
    "code": "CPM107",
    "nameTh": "ผู้ป่วยได้รับยาที่มีคู่ยาปฏิกิริยารุนแรง",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1.3"
  },
  {
    "code": "CPM201",
    "nameTh": "Medication error : Prescribing (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอนการสั่ง ใช้ยา)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2"
  },
  {
    "code": "CPM202",
    "nameTh": "Medication error : Transcribing (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอนการ คัดลอกยา)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2"
  },
  {
    "code": "CPM203",
    "nameTh": "Medication error : Pre-dispensing (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอน การจัดเตรียมจ่ายยา)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2"
  },
  {
    "code": "CPM204",
    "nameTh": "Medication error : Dispensing (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอนการจ่าย ยา)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2"
  },
  {
    "code": "CPM205",
    "nameTh": "Medication error : Administration (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอน การให้ยา)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2"
  },
  {
    "code": "CPM206",
    "nameTh": "ไม่มี/ไม่ปฏิบัติตาม Guideline เกี่ยวกับ Look-Alike Sound-Alike Medication Names",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2.1"
  },
  {
    "code": "CPM207",
    "nameTh": "ผู้ป่วยได้รับยา ในกลุ่ม Look-Alike Sound-Alike Medication Names",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2.1"
  },
  {
    "code": "CPM208",
    "nameTh": "ไม่มี/ไม่ปฏิบัติตามมาตรฐาน หรือ Guideline ของการใช้ยา ยกเว้น HAD, Fatal drug, Look-Alike Sound-Alike, Antibiotics",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2.2"
  },
  {
    "code": "CPM301",
    "nameTh": "ไม่มี/ไม่ปฏิบัติตาม Guideline เกี่ยวกับ Medication Reconciliation",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M3"
  },
  {
    "code": "CPM302",
    "nameTh": "ผู้ป่วยไม่ได้รับยาเดิมต่อเนื่องจากไม่ได้ทำ Medication Reconciliation",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M3"
  },
  {
    "code": "CPM303",
    "nameTh": "ผู้ป่วยได้รับยาซ้ำซ้อนจากไม่ได้ทำ Medication Reconciliation",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M3"
  },
  {
    "code": "CPM304",
    "nameTh": "ผู้ป่วยได้รับยาที่มีปฏิกิริยากันโดยไม่ได้ทำ Medication Reconciliation",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M3"
  },
  {
    "code": "CPM401",
    "nameTh": "ไม่มี/ไม่ปฏิบัติตาม Guideline เกี่ยวกับ Rational Drug Use",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M4"
  },
  {
    "code": "CPM402",
    "nameTh": "การใช้ยาปฏิชีวนะในโรคติดเชื้อที่ระบบการหายใจช่วงบนและหลอดลมอักเสบ เฉียบพลันในผู้ป่วยนอก",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M4"
  },
  {
    "code": "CPM403",
    "nameTh": "การใช้ยาปฏิชีวนะในโรคอุจจาระร่วงเฉียบพลัน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M4"
  },
  {
    "code": "CPM404",
    "nameTh": "การใช้ยาอย่างไม่สมเหตุผล (ยกเว้นยาปฏิชีวนะ)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M4"
  },
  {
    "code": "CPM501",
    "nameTh": "การให้เลือดผิด (Incorrect blood component transfused, IBCT หรือ Wrong blood transfused)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CPM502",
    "nameTh": "การมีปฏิกิริยาจากการได้รับเลือด (Transfusion reaction)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CPM503",
    "nameTh": "การไม่ปฏิบัติตามข้อกำหนด (Specific requirements not met, SRNM) ซึ่งเป็น เหตุให้ผู้ป่วยได้รับส่วนประกอบของเลือดที่ไม่เป็นไปตามที่กำหนด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CPM504",
    "nameTh": "การให้เลือดที่ไม่เหมาะสม (Inappropriate transfusion)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CPM505",
    "nameTh": "เกิดความผิดพลาดในการนำส่งและจัดเก็บส่วนประกอบของเลือด (Handling and storage errors, HSE)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CPM506",
    "nameTh": "กระบวนการปฏิบัติงาน/ขั้นตอนการดำเนินงานในการให้เลือดผู้ป่วยคลาดเคลื่อน จากข้อกำหนด (Right blood right patient, RBRP)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CPP101",
    "nameTh": "Patient Identification",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P1"
  },
  {
    "code": "CPP201",
    "nameTh": "การรายงานอาการ หรือสื่อสารข้อมูลเกี่ยวกับผู้ป่วยไม่เหมาะสม/ไม่ครบถ้วน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2.1"
  },
  {
    "code": "CPP202",
    "nameTh": "การสื่อสารเพื่อการส่งตรวจหรือการรักษาทางรังสีวิทยาผิดพลาด/ไม่ครบถ้วน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2.2"
  },
  {
    "code": "CPP203",
    "nameTh": "การสื่อสารเพื่อการส่งตรวจทางห้องปฏิบัติการผิดพลาด/ไม่ครบถ้วน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2.2"
  },
  {
    "code": "CPP204",
    "nameTh": "การสื่อสารหรือส่งต่อข้อมูลการรักษาพยาบาลผู้ป่วยผิดพลาด เช่น ไม่สื่อสาร/ สื่อสารผิด/สื่อสารไม่ครบถ้วน/สื่อสารล่าช้า",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2.2"
  },
  {
    "code": "CPP205",
    "nameTh": "ไม่รายงาน Critical Test Results หรือรายงานล่าช้า",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2.3"
  },
  {
    "code": "CPP206",
    "nameTh": "เกิดความผิดพลาดในการรักษาพยาบาลซึ่งมีสาเหตุมาจาก Verbal or Telephone Order/Communication",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2.4"
  },
  {
    "code": "CPP207",
    "nameTh": "เกิดความผิดพลาดจากการใช้สื่อในกระบวนการรักษาพยาบาล เช่น ใช้คำย่อ/ ชื่อย่อ/สัญลักษณ์ที่ไม่เป็นสากล",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2.5"
  },
  {
    "code": "CPP301",
    "nameTh": "Misdiagnosis or delay diagnosis",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP302",
    "nameTh": "(Access & Entry) ผู้ป่วยเข้าถึงหรือได้รับบริการ ผิด/ล่าช้าไปจากเกณฑ์ หรือ โรคที่เป็น",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP303",
    "nameTh": "(Patient Assessment) ผู้ป่วยไม่ได้รับการประเมิน/ประเมินผิด/ประเมินไม่ ครบถ้วน ตามเกณฑ์ อาการหรือการดำเนินโรค",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP304",
    "nameTh": "(Planning of Care) ผู้ป่วยไม่ได้รับการวางแผนดูแล/วางแผนไม่ครอบคลุม หรือวางแผนผิดไปจากพยาธิสภาพ/สภาวะของโรค",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP305",
    "nameTh": "(Discharge Planning) ผู้ป่วยกลุ่มโรคจำเป็นไม่ได้รับการวางแผนจำหน่าย/ วางแผนไม่ครอบคลุม ตามเกณฑ์ หรือประเด็น",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP306",
    "nameTh": "(Patient Care Delivery) ผู้ป่วยได้รับการดูแลไม่ครอบคลุม/ ไม่เชื่อมโยง/ไม่ สอดคล้อง ตามเกณฑ์ อาการ หรือโรค",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP307",
    "nameTh": "(Patient Care Delivery) ผู้ป่วยได้รับการทำหัตถการที่มีความเสี่ยงใน สถานการณ์ หรือสถานที่ไม่เหมาะสม",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP308",
    "nameTh": "(Patient Care Delivery) ผู้ป่วยได้รับอาหารไม่เหมาะสมตามความต้องการ พื้นฐาน หรือข้อบ่งชี้ของโรค/การเจ็บป่วย",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP309",
    "nameTh": "(Information and Empowerment) ผู้ป่วย/ครอบครัวไม่ได้รับข้อมูลเพื่อ เสริมพลัง หรือได้รับไม่ชัดเจน/ ไม่ต่อเนื่อง/ไม่เหมาะสม กับการรับรู้หรือมี ส่วนร่วม",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP310",
    "nameTh": "(Information and Empowerment) ข้อมูลการวินิจฉัย/การดูแลรักษาของ ผู้ป่วยไม่ได้รับการบันทึกหรือได้รับการบันทึกไม่ครบถ้วน ไม่ชัดเจน ไม่เชื่อมโยง ต่อเนื่อง",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP311",
    "nameTh": "(Continuity of Care) ผู้ป่วยได้รับการดูแลไม่ต่อเนื่อง/ไม่เชื่อมโยง/ไม่ สอดคล้อง กับบริบทและสภาวะของโรค",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P3"
  },
  {
    "code": "CPP401",
    "nameTh": "ผู้ป่วยเกิดภาวะแทรกซ้อนจากกระบวนการดูแลรักษาพยาบาลซึ่งป้องกันได้ (ยกเว้น เกิดแผลกดทับ, ตกเตียง/fall)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P4"
  },
  {
    "code": "CPP402",
    "nameTh": "ผู้ป่วยพยายามฆ่าตัวตาย/ฆ่าตัวตาย",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P4"
  },
  {
    "code": "CPP403",
    "nameTh": "ผู้ป่วยถูกลักพาตัว สลับ หรือสูญหาย หรือพลัดหลง หรือหลบหนี",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P4"
  },
  {
    "code": "CPP404",
    "nameTh": "เกิดแผลกดทับ",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P4.1"
  },
  {
    "code": "CPP405",
    "nameTh": "ตกเตียง/fall",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P4.2"
  },
  {
    "code": "CPP406",
    "nameTh": "ผู้ป่วยอาละวาดก้าวร้าว",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P4"
  },
  {
    "code": "CPP501",
    "nameTh": "ผู้ป่วยไม่ได้รับ หรือได้รับการบรรเทาอาการปวดไม่เหมาะสมกับสภาพอาการ",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P5.1"
  },
  {
    "code": "CPP502",
    "nameTh": "ผู้ป่วยมีภาวะแทรกซ้อนหรือเหตุการณ์ไม่พึงประสงค์จากการจัดการความปวด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P5.1"
  },
  {
    "code": "CPP503",
    "nameTh": "ผู้ป่วย Acute Pain ไม่ได้รับ หรือได้รับการบรรเทาอาการปวดไม่เหมาะสม",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P5.2"
  },
  {
    "code": "CPP504",
    "nameTh": "Chronic Non-Cancer Patients ได้รับการสั่งใช้ Opioids ไม่เหมาะสม",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P5.3"
  },
  {
    "code": "CPP505",
    "nameTh": "ผู้ป่วยมีภาวะแทรกซ้อนหรือเหตุการณ์ไม่พึงประสงค์จากการใช้ opioids ใน การระงับปวดเรื้อรังที่มิใช่มะเร็ง",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P5.3"
  },
  {
    "code": "CPP506",
    "nameTh": "Management for Cancer Pain and Palliative Care ไม่เหมาะสม",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P5.4"
  },
  {
    "code": "CPP601",
    "nameTh": "ผู้ป่วยที่จำเป็นต้องส่งต่อเพื่อการรักษา ไม่ได้รับการส่งต่อหรือส่งต่อได้ใน ช่วงเวลาไม่เหมาะสม",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P6"
  },
  {
    "code": "CPP602",
    "nameTh": "มีภาวะแทรกซ้อนหรือเหตุการณ์ไม่พึงประสงค์ที่ป้องกันได้ระหว่างส่งต่อ",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P6"
  },
  {
    "code": "CPL101",
    "nameTh": "ท่อ เลื่อนหลุดเกิด re-intubation",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "L1"
  },
  {
    "code": "CPL102",
    "nameTh": "Mis-connect, Dis-connect",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "L1"
  },
  {
    "code": "CPL103",
    "nameTh": "ความคลาดเคลื่อนการให้สารน้ำจากการใช้ Infusion pump",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "L1"
  },
  {
    "code": "CPL201",
    "nameTh": "ผลการตรวจวิเคราะห์ทางห้องปฏิบัติการผิดพลาด ล่าช้า หรือไม่สามารถ ปฏิบัติการตรวจวิเคราะห์ได้",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "L2"
  },
  {
    "code": "CPL202",
    "nameTh": "สิ่งส่งตรวจไม่ถูกต้อง ไม่เหมาะสม หรือไม่มีสิ่งส่งตรวจ",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "L2"
  },
  {
    "code": "CPL203",
    "nameTh": "เตรียมตรวจ/ตรวจทางรังสีผิดพลาด (เช่น ผิดประเภท/ผิดคำสั่ง/ผิดตำแหน่ง/ ผิดข้าง/ผิดเทคนิคการตรวจ)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "L2"
  },
  {
    "code": "CPE101",
    "nameTh": "Un-planed Cardiopulmonary Resuscitation (CPR)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CPE201",
    "nameTh": "Sepsis with death",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E2.1"
  },
  {
    "code": "CPE202",
    "nameTh": "ผู้ป่วย Acute Coronary Syndrome ไม่ได้รับการตรวจรักษาในช่วงเวลา golden period",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E2.2"
  },
  {
    "code": "CPE203",
    "nameTh": "Acute Ischemic Stroke ที่ให้การรักษาไม่ทัน golden period",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E2.3"
  },
  {
    "code": "CPE204",
    "nameTh": "เกิดภาวะแทรกซ้อนจากการทำ Cardiopulmonary Resuscitation (CPR)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E2.4"
  },
  {
    "code": "CPE301",
    "nameTh": "PPH with Complicate",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E3.1"
  },
  {
    "code": "CPE302",
    "nameTh": "มารดาเสียชีวิตจากการคลอด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E3.2"
  },
  {
    "code": "CPE303",
    "nameTh": "ทารกเสียชีวิตจากการคลอด",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E3.2"
  },
  {
    "code": "CPE304",
    "nameTh": "ภาวะแทรกซ้อนจากการคลอดที่ป้องกันได้เกิดขึ้นกับมารดา",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E3.2"
  },
  {
    "code": "CPE305",
    "nameTh": "ภาวะแทรกซ้อนจากการคลอดที่ป้องกันได้เกิดขึ้นกับทารก (Birth injury)",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E3.2"
  },
  {
    "code": "CPE306",
    "nameTh": "Severe Birth Asphyxia",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E3.3"
  },
  {
    "code": "CPE401",
    "nameTh": "ผู้ป่วยฉุกเฉินไม่ได้รับการตรวจรักษาภายในระยะเวลา 30 นาที",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.1"
  },
  {
    "code": "CPE402",
    "nameTh": "Under triage",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.1"
  },
  {
    "code": "CPE403",
    "nameTh": "Over triage",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.1"
  },
  {
    "code": "CPE404",
    "nameTh": "ผู้ป่วยไม่รอตรวจ ไม่พึงพอใจ ร้องเรียน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.1"
  },
  {
    "code": "CPE405",
    "nameTh": "Delay Diagnosis and Delay treatment ในผู้ป่วย ฉุกเฉิน และผู้ป่วย Fast Track",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.1"
  },
  {
    "code": "CPE406",
    "nameTh": "ผู้ป่วยเสียชีวิตที่ห้องฉุกเฉินระหว่างรอการตรวจรักษา",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.2"
  },
  {
    "code": "CPE407",
    "nameTh": "Missed Diagnosis",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.2"
  },
  {
    "code": "CPE408",
    "nameTh": "Un-planed ICU ในผู้ป่วยฉุกเฉิน/ ผู้ป่วยวิกฤติ",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.3"
  },
  {
    "code": "CPE409",
    "nameTh": "ผู้ป่วยได้รับการตรวจรักษาในห้องฉุกเฉินนานมากกว่า 2 ชั่วโมงก่อน Admit หรือนานมากกว่า 4 ชั่วโมงก่อนการจำหน่ายกลับบ้าน",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.4"
  },
  {
    "code": "CPE410",
    "nameTh": "เกิดอุบัติภัยหมู่ที่ให้ความช่วยเหลือได้ไม่ทันเวลา",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.5"
  },
  {
    "code": "CPE411",
    "nameTh": "เกิด disaster หรือภาวะฉุกเฉินที่ไม่พึงประสงค์ต่าง ๆ ที่ ER",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E4.5"
  },
  {
    "code": "CPO101",
    "nameTh": "เรื่องอื่น ๆ ที่ไม่ใช่ SIMPLE โปรดระบุ ..............................................................",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "-"
  },
  {
    "code": "CSG101",
    "nameTh": "เกิดปัญหา in VBAC เช่น Uterine rupture/ตกเลือด ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G1"
  },
  {
    "code": "CSG102",
    "nameTh": "เกิดปัญหาใน Preclampsia (เช่น Eclampsia/HELLP Syndrome/Severe eclampsia/Abruption/SE from MgSO4) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G1"
  },
  {
    "code": "CSG103",
    "nameTh": "เกิดปัญหาใน Pregnancy with GDM (เช่น Polyhydramneos/PIH/Macrosomia/DFIU) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G1"
  },
  {
    "code": "CSG104",
    "nameTh": "เกิดปัญหาใน Pregnancy with HIV เช่น M-F transmission ตอนที่ III/",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G1"
  },
  {
    "code": "CSG105",
    "nameTh": "เกิดภาวะวิกฤติใน Placenta Previa (เช่น APH/PPH) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G1"
  },
  {
    "code": "CSG106",
    "nameTh": "เกิดภาวะแทรกซ้อนใน Amniocentisis (เช่น Haemorrhage/Sepsis/Fetal loss/Abort/Uterine contraction) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G1"
  },
  {
    "code": "CSG107",
    "nameTh": "เกิดปัญหาใน Premature Contraction (เช่น Preterm labour/SE from Inhibit) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G1"
  },
  {
    "code": "CSG201",
    "nameTh": "เกิดปัญหาใน Twin (เช่น Preterm labour/PROM/PPH/Birth asphysia/PIH/Discordant twin) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G2"
  },
  {
    "code": "CSG301",
    "nameTh": "เกิด TOA ใน PID ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G3"
  },
  {
    "code": "CSG302",
    "nameTh": "เกิดภาวะวิกฤติ ใน Abort (เช่น Embolism/Shock) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G3"
  },
  {
    "code": "CSG303",
    "nameTh": "เกิดภาวะวิกฤติใน Ectopic pregnancy (เช่น Rupture/Shock) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G3"
  },
  {
    "code": "CSG304",
    "nameTh": "เกิดภาวะวิกฤติใน Ovarian tumor (เช่น Rupture/Twist) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G3"
  },
  {
    "code": "CSG305",
    "nameTh": "เกิดภาวะแทรกซ้อนใน CIN (เช่น Persistence/Recurrent/CA Cervix) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G3"
  },
  {
    "code": "CSG306",
    "nameTh": "เกิดภาวะแทรกซ้อนใน Myoma uteri (เช่น Hypermenorrhea/Infertile/Urinary Incontenence) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "G3"
  },
  {
    "code": "CSS101",
    "nameTh": "ทำ Perm-cath insertion แล้วเกิด Bleeding/Pneumothorax ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1"
  },
  {
    "code": "CSS102",
    "nameTh": "เกิด Bleeding with shock ในโรค Blunt abdominal injury ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1"
  },
  {
    "code": "CSS103",
    "nameTh": "เกิด Bowel gangrene ในโรค Hernia ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1"
  },
  {
    "code": "CSS104",
    "nameTh": "เกิด Gut obstruction ในโรค Carcinoma of colon ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1"
  },
  {
    "code": "CSS105",
    "nameTh": "เกิด Intracranial hemorrhage ในโรค Head injury ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1"
  },
  {
    "code": "CSS106",
    "nameTh": "เกิด Rupture ในโรค Acute appendicitis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1"
  },
  {
    "code": "CSS107",
    "nameTh": "เกิด Sepsis ในโรค Acute cholecystitis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1"
  },
  {
    "code": "CSS108",
    "nameTh": "เกิด Sepsis ในโรค Cellulitis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S1"
  },
  {
    "code": "CSS201",
    "nameTh": "เกิด Bleeding ใน PCNC (Percutaneous Nephrocystostomy catheter) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S2"
  },
  {
    "code": "CSS202",
    "nameTh": "เกิด Hydro-pneumothorax ใน PCNC (Percutaneous Nephrocystostomy catheter) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S2"
  },
  {
    "code": "CSS203",
    "nameTh": "เกิด Renal pelvis perforation ใน PCNC (Percutaneous Nephrocystostomy catheter) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "S2"
  },
  {
    "code": "CSM101",
    "nameTh": "เกิด Hypoxemia/Respiratory failure ใน Exacerbation of COPD ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1"
  },
  {
    "code": "CSM102",
    "nameTh": "เกิด Hypoxemia/Respiratory failure ใน Severe asthma ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1"
  },
  {
    "code": "CSM103",
    "nameTh": "เกิด Hypoxemia/Respiratory failure ในโรค Avain influenza ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1"
  },
  {
    "code": "CSM104",
    "nameTh": "เกิด Hypoxemia/Respiratory failure ในโรค H1N1 influenza ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1"
  },
  {
    "code": "CSM105",
    "nameTh": "เกิด Hypoxemia/Respiratory failure ในโรค SARS ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1"
  },
  {
    "code": "CSM106",
    "nameTh": "เกิดภาวะ Hypoxemia/Pneumothorax ในโรค PCP ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1"
  },
  {
    "code": "CSM107",
    "nameTh": "เกิดภาวะ Hypoxemia/Respiratory failure ในโรค TB Lung ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M1"
  },
  {
    "code": "CSM201",
    "nameTh": "เกิด CHF/Arrhythmia/Cardiogenic shock ใน AMI ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M2"
  },
  {
    "code": "CSM301",
    "nameTh": "เกิดภาวะ Hypokalemia ในโรค Acute/Chronic Diarrhea ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M3"
  },
  {
    "code": "CSM302",
    "nameTh": "เกิดภาวะ Hypovolumic Shock ในโรค Acute/Chronic Diarrhea ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M3"
  },
  {
    "code": "CSM303",
    "nameTh": "เกิดภาวะ Hypovolumic Shock ในโรค UGI Bleeding ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M3"
  },
  {
    "code": "CSM401",
    "nameTh": "เกิดภาวะ Brain herniation ในโรค Toxoplasmosis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M4"
  },
  {
    "code": "CSM402",
    "nameTh": "เกิดภาวะ Brain herniation ในโรค CVA ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M4"
  },
  {
    "code": "CSM403",
    "nameTh": "เกิดภาวะ Aspirate pneumonia ในโรค CVA ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M4"
  },
  {
    "code": "CSM404",
    "nameTh": "เกิดภาวะ IICP ในโรค Cryptococcal meningitis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M4"
  },
  {
    "code": "CSM501",
    "nameTh": "เกิด Internal bleeding จากการทำ Liver biopsy ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CSM502",
    "nameTh": "เกิด Pneumothorax จากการทำ Bronchoscopy ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CSM503",
    "nameTh": "เกิด Brain herniation จากการทำ Lumbar punture ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CSM504",
    "nameTh": "เกิด Gut perforation จากการทำ Gastroscopy/Colonoscopy ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CSM601",
    "nameTh": "เกิดภาวะ Sepsis/Malnutrition ใน Steven Johnson Syndrome ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M6"
  },
  {
    "code": "CSM602",
    "nameTh": "เกิดภาวะ Septic shock ในโรค Acute pyelonephritis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M6"
  },
  {
    "code": "CSM603",
    "nameTh": "เกิดภาวะ Septic shock/Cardiac arrest ใน Sepsis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M6"
  },
  {
    "code": "CSM604",
    "nameTh": "เกิดภาวะ Severe acidosis ใน Lactic acidosis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M6"
  },
  {
    "code": "CSM605",
    "nameTh": "เกิดภาวะ Shock/Arrhythmia จากการทำ Hemodialysis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M5"
  },
  {
    "code": "CSM606",
    "nameTh": "เกิดภาวะแทรกซ้อนฉุกเฉินในโรค DM (เช่น Hypoglycemia/DKA) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M6"
  },
  {
    "code": "CSM607",
    "nameTh": "เกิดภาวะแทรกซ้อนฉุกเฉินในโรค Dengue fever (เช่น Shock/Bleeding) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M6"
  },
  {
    "code": "CSM608",
    "nameTh": "เกิดภาวะแทรกซ้อนฉุกเฉินในโรค ESRD (เช่น Fluid overload/Hyperkalemia) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M6"
  },
  {
    "code": "CSM609",
    "nameTh": "เกิดภาวะแทรกซ้อนฉุกเฉินในโรค HT (เช่น CVA/Encephalopathy) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "M6"
  },
  {
    "code": "CSP101",
    "nameTh": "เกิด Apnea/RDS/BPD/ROP/NEC/Anemia ใน Preterm ที่ VLBW ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P1"
  },
  {
    "code": "CSP102",
    "nameTh": "เกิด Hypo-Hyperglycemia ใน Preterm ที่ VLBW ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P1"
  },
  {
    "code": "CSP103",
    "nameTh": "เกิด Hypo-Hyperthermia ใน Preterm ที่ VLBW ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P1"
  },
  {
    "code": "CSP104",
    "nameTh": "เกิด Hypo-Hyperglycemia/Polycythemia ใน Macrosomia/LGA/GDM ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P1"
  },
  {
    "code": "CSP105",
    "nameTh": "เกิด PPHN/Pneumothorax ใน MAS ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P1"
  },
  {
    "code": "CSP201",
    "nameTh": "เกิด Acidosis/Electrolyte Imbalance ในโรค Acute Diarrhea ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2"
  },
  {
    "code": "CSP202",
    "nameTh": "เกิด Sepsis/Emphysema/IRDS/Hypoxia ในโรค Pneumonia ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2"
  },
  {
    "code": "CSP203",
    "nameTh": "เกิด Shock/Bleeding/Pleural effusion ในโรค DHF ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "P2"
  },
  {
    "code": "CSO101",
    "nameTh": "กระดูกหักใกล้ข้อ/หลังเข้าเฝือก 24 ชั่วโมง แล้วเกิด Compartment syndrome ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "O1"
  },
  {
    "code": "CSO102",
    "nameTh": "ดึงถ่วงน้ำหนักผ่านกระดูก แล้วเกิดการเปลี่ยนแปลงระบบไหลเวียนเลือด ส่วนปลาย และระบบประสาท ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "O1"
  },
  {
    "code": "CSO103",
    "nameTh": "เกิดภาวะแทรกซ้อนในโรค Long bone fracture เช่น Chest injury/Abdominal injury/C-spine injury/Fat embolism ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "O1"
  },
  {
    "code": "CSO104",
    "nameTh": "เกิดภาวะแทรกซ้อนใน Total knee replacement เช่น Active blood loss/spinal shock ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "O1"
  },
  {
    "code": "CSO105",
    "nameTh": "เกิดภาวะแทรกซ้อนใน Hip replacement เช่น Dislocation/Sciatic nerve injury/Hematoma/Fracture ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "O1"
  },
  {
    "code": "CSO106",
    "nameTh": "เกิดภาวะแทรกซ้อนใน Laminectomy/Discectomy เช่น Cauda equina syndrome/Nerve root injury ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "O1"
  },
  {
    "code": "CSE101",
    "nameTh": "Iris prolapsed ใน ECCE ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CSE102",
    "nameTh": "Rupture posterior capsule ใน ECCE ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CSE103",
    "nameTh": "Rupture posterior capsule ใน Phaco with IOL ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CSE104",
    "nameTh": "กระจกตาบวม ใน ECCE ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CSE105",
    "nameTh": "กระจกตาบวม ใน Phaco with IOL ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CSE106",
    "nameTh": "Endophthalmitis ใน ECCE ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CSE107",
    "nameTh": "Endophthalmitis ใน Phaco with IOL ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CSE108",
    "nameTh": "Endophthamitis ใน Intravitreous ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E1"
  },
  {
    "code": "CSE201",
    "nameTh": "เกิดภาวะแทรกซ้อนในการทำ Tracheostomy Tube (เช่น Subcutaneous Emphysema/Bleeding/Pneumothorax/T-E fistula/Nerve injury) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E2"
  },
  {
    "code": "CSE202",
    "nameTh": "เกิดภาวะแทรกซ้อนใน Thyroidectomy (เช่น Nerve injury/Hematoma/Hypoparathyroidism/Dysphagia) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E2"
  },
  {
    "code": "CSE203",
    "nameTh": "เกิดภาวะแทรกซ้อนใน Tonsillectomy (เช่น Bleeding/Nasopharygeal stenosis) ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "E2"
  },
  {
    "code": "CSD101",
    "nameTh": "เกิดปัญหาใน Dental Tx ผู้ป่วยโรค DM เช่น Hypo-Hyperglycemia/แผล หายช้า/Advance Periodontitis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD102",
    "nameTh": "เกิดปัญหาใน Dental Tx in Hemorrhagic disorders เช่น Spontaneous or prolong bleeding/Delayed healing ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD103",
    "nameTh": "เกิด Airway obstruction ในโรค Ludwig's Angina ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD104",
    "nameTh": "เกิด Allergy to Local anesthesia ใน Dental Tx ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD105",
    "nameTh": "เกิด Chest pain/Acute MI ใน Dental Tx ผู้ป่วยโรค Angina pectoris or MI ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD106",
    "nameTh": "เกิด Subacute bacterial endocarditis ใน Dental Tx ผู้ป่วยโรคลิ้นหัวใจ หรือใส่ลิ้นหัวใจเทียม ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD107",
    "nameTh": "เกิด Tumor that extends to malignancy ในโรค Oral lesion แผลในช่องปาก ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD108",
    "nameTh": "เกิดภาวะฉุกเฉินใน Emergency in dental clinic เช่น Syncope/Hyperventilation/Toxic effect of local anesthesia ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD109",
    "nameTh": "เกิดภาวะแทรกซ้อนในผู้ป่วย Head and neck cancer therapy เช่น Osteoradionecrosis/Halitosis/Mucositis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD110",
    "nameTh": "เกิดภาวะแทรกซ้อนใน Oral surgery/Simple-Surgical extraction เช่น Bleeding/Pain and Swelling/Fibrinolytic alveolitis ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "CSD111",
    "nameTh": "แผลถอนฟันหายช้าและติดเชื้อ ในผู้ป่วย HIV/Immunosuppressive/On steroid ตอนที่ III /",
    "nameEn": null,
    "clinicalOrGeneral": "Clinical",
    "simpleCategory": "D1"
  },
  {
    "code": "GPS101",
    "nameTh": "เกิดอุบัติการณ์ด้านความมั่นคงปลอดภัยไซเบอร์ที่ทำให้ข้อมูลความลับของ สถานพยาบาลรั่วไหล (Confidentiality Failure)",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GPS102",
    "nameTh": "เกิดอุบัติการณ์ด้านความมั่นคงปลอดภัยไซเบอร์ที่ทำให้ข้อมูลสารสนเทศของ สถานพยาบาลถูกแก้ไข/ลบ/เพิ่มเติม/ทำให้เสียหายหรือสูญหายโดยมิชอบ (Integrity Failure)",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GPS103",
    "nameTh": "เกิดอุบัติการณ์ด้านความมั่นคงปลอดภัยไซเบอร์ที่ทำให้ระบบสารสนเทศของ สถานพยาบาลขัดข้อง/ใช้การไม่ได้/ทำงานช้าหรือไม่ปกติ (Availability Failure)",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GPS104",
    "nameTh": "เกิดอุบัติการณ์ด้านความมั่นคงปลอดภัยไซเบอร์ที่ทำให้เกิดความเสียหายต่อข้อมูล หรือระบบสารสนเทศของสถานพยาบาลมากกว่าหนึ่งด้าน (Multiple Failures) ระหว่าง Confidentiality Failure, Integrity Failure และ Availability Failure",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GPS105",
    "nameTh": "เกิดอุบัติการณ์การละเมิดความเป็นส่วนตัว (Privacy) ของข้อมูลส่วนบุคคลของ บุคลากรหรือนักศึกษาของสถานพยาบาล ที่ไม่ใช่อุบัติการณ์ด้านความมั่นคง ปลอดภัยไซเบอร์",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GPS106",
    "nameTh": "เกิดอุบัติการณ์ความละเมิดความเป็นส่วนตัว (Privacy) ของข้อมูลส่วนบุคคลของ ผู้ป่วย/ผู้รับบริการ หรือบุคคลภายนอก ที่ไม่ใช่อุบัติการณ์ด้านความมั่นคง ปลอดภัยไซเบอร์",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GPS201",
    "nameTh": "บุคลากรถูกกล่าวถึงหรือวิพากษ์วิจารณ์ในทางลบบนสื่อสังคมออนไลน์หรือสื่อ สาธารณะที่เกี่ยวข้องกับการปฏิบัติหน้าที่",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S2"
  },
  {
    "code": "GPS202",
    "nameTh": "บุคลากรถูกกล่าวถึงหรือวิพากษ์วิจารณ์ในทางลบบนสื่อสังคมออนไลน์หรือสื่อ สาธารณะที่ไม่ได้เกี่ยวข้องกับการปฏิบัติหน้าที่",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S2"
  },
  {
    "code": "GPS203",
    "nameTh": "บุคลากรใช้สื่อสังคมออนไลน์ไม่เหมาะสม เกิดผลกระทบทางลบต่อตนเอง บุคลากรคนอื่น สถานพยาบาล ผู้ป่วย/ผู้รับบริการ หรือบุคคลภายนอก",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S2"
  },
  {
    "code": "GPS204",
    "nameTh": "เกิดอุบัติการณ์ที่ส่งผลกระทบทางลบต่อสถานพยาบาลบนสื่อสังคมออนไลน์ เช่น Drama, Fake News แต่ไม่ได้เกิดจากบุคลากร และไม่กระทบบุคลากรคนใดคน หนึ่งโดยตรง",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S2"
  },
  {
    "code": "GPI101",
    "nameTh": "บุคลากรถูกวัสดุอุปกรณ์มีคมทิ่มตำ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GPI102",
    "nameTh": "บุคลากรสัมผัสเลือดหรือสารคัดหลั่งบริเวณเยื่อบุหรือผิวหนังที่มีแผล (mucous membrane and non-intact skin exposure to blood and body fluid)",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GPI103",
    "nameTh": "บุคลากรไม่ได้รับการสร้างภูมิคุ้มกันโรคก่อนสัมผัส (pre-exposure prophylaxis, active immunization) ที่เหมาะสมตามลำดับความสำคัญและหน้าที่",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GPI104",
    "nameTh": "บุคลากรไม่ได้รับการป้องกันการติดเชื้อหลังสัมผัสเชื้อที่อาจก่อโรคได้จากการ ปฏิบัติงาน (post-exposure prophylaxis, passive immunization)",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GPI201",
    "nameTh": "บุคลากรติดเชื้อที่แพร่ทางอากาศ (airborne transmission) จากการปฏิบัติงาน ได้แก่ วัณโรค หัด และอีสุกอีใส",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I2.1"
  },
  {
    "code": "GPI202",
    "nameTh": "บุคลากรติดเชื้อที่แพร่ผ่านละอองฝอย (droplet transmission) จากการ ปฏิบัติงาน เช่น ไข้หวัดใหญ่ หัดเยอรมัน ฯลฯ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I2.2"
  },
  {
    "code": "GPI203",
    "nameTh": "บุคลากรติดเชื้อที่แพร่ทางการสัมผัส (contact transmission) จากการปฏิบัติงาน เช่น เอชไอวี ตับอักเสบบี ตับอักเสบซี ฯลฯ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I2.3"
  },
  {
    "code": "GPI204",
    "nameTh": "บุคลากรติดเชื้อที่แพร่ผ่านพาหะ (vector borne transmission) จากการ ปฏิบัติงาน เช่น ไข้เลือดออก ซิก้า ฯลฯ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I2.4"
  },
  {
    "code": "GPM101",
    "nameTh": "เจ้าหน้าที่ทะเลาะกันในขณะปฏิบัติงาน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M1.1"
  },
  {
    "code": "GPM102",
    "nameTh": "เจ้าหน้าที่ถูกคุกคามทางจิตใจ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M1.2"
  },
  {
    "code": "GPM103",
    "nameTh": "เจ้าหน้าที่มีภาวะเป็น second victim",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M1.2"
  },
  {
    "code": "GPM104",
    "nameTh": "เจ้าหน้าที่มีภาวะเครียดจากการทำงาน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M1.3"
  },
  {
    "code": "GPM203",
    "nameTh": "เกิดเรื่องร้องเรียนจากการบริการทางการแพทย์",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M2"
  },
  {
    "code": "GPM204",
    "nameTh": "เกิดเรื่องร้องเรียนทั่วไป ซึ่งไม่เกี่ยวกับการบริการทางการแพทย์",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M2"
  },
  {
    "code": "GPM205",
    "nameTh": "เกิดเรื่องฟ้องร้องทางคดีผู้บริโภค",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M2"
  },
  {
    "code": "GPM206",
    "nameTh": "เกิดเรื่องฟ้องร้องทางคดีแพ่ง",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M2"
  },
  {
    "code": "GPM207",
    "nameTh": "เกิดเรื่องฟ้องร้องทางคดีอาญา",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M2"
  },
  {
    "code": "GPM208",
    "nameTh": "เกิดเรื่องฟ้องร้องทางคดีปกครอง",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M2"
  },
  {
    "code": "GPP101",
    "nameTh": "บุคลากรปฏิบัติงานโดยมีภาระงานที่มากเกินเกณฑ์มาตรฐาน (work load)",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P1"
  },
  {
    "code": "GPP102",
    "nameTh": "บุคลากรที่มีภาวะเสี่ยงต่อการติดเชื้อ หรือรับการแพร่กระจายเชื้อ ไม่ได้รับการ ป้องกันหรือดูแลที่เหมาะสม",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P1"
  },
  {
    "code": "GPP103",
    "nameTh": "บุคลากรประสบอุบัติเหตุหรือบาดเจ็บจากการปฏิบัติงาน (ยกเว้น ถูกวัสดุอุปกรณ์ มีคมทิ่มตำ)",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P1"
  },
  {
    "code": "GPP201",
    "nameTh": "องค์กรเกิดภาวะที่คุกคามบุคลากรด้านกายภาพ ได้แก่ เสียงดัง (noise) แสงสว่าง (light) ความร้อน (heat)",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.1"
  },
  {
    "code": "GPP202",
    "nameTh": "บุคลากรไม่ได้รับ/ไม่ได้ใช้อุปกรณ์ หรือใช้ไม่ถูกต้องในการป้องกันและคุ้มครอง ความปลอดภัยทางกายภาพ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.1"
  },
  {
    "code": "GPP203",
    "nameTh": "บุคลากรเกิดโรคจากการทำงาน ซึ่งมีสาเหตุจาก Physical Hazard",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.1"
  },
  {
    "code": "GPP204",
    "nameTh": "องค์กรมีภาวะความไม่ปลอดภัยจากสารเคมีและวัตถุอันตราย",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.2"
  },
  {
    "code": "GPP205",
    "nameTh": "บุคลากรไม่ได้รับ/ไม่ได้ใช้อุปกรณ์ หรือใช้ไม่ถูกต้องในการป้องกันและคุ้มครอง ความปลอดภัยทางเคมี",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.2"
  },
  {
    "code": "GPP206",
    "nameTh": "บุคลากรเกิดโรคจากการทำงาน ซึ่งมีสาเหตุจาก Chemical Hazard",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.2"
  },
  {
    "code": "GPP207",
    "nameTh": "องค์กรเกิดความไม่ปลอดภัยจากรังสีในที่ทำงาน เช่น เกิดการรั่วไหลของรังสี",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.3"
  },
  {
    "code": "GPP208",
    "nameTh": "บุคลากรไม่ได้รับ/ไม่ได้ใช้อุปกรณ์ หรือใช้ไม่ถูกต้องในการป้องกันและคุ้มครอง ความปลอดภัยทางรังสี",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.3"
  },
  {
    "code": "GPP209",
    "nameTh": "บุคลากรเกิดโรคจากการทำงาน ซึ่งมีสาเหตุจาก Radiation Hazard",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.3"
  },
  {
    "code": "GPP210",
    "nameTh": "บุคคลากรมีการทำงานในท่าทางหรือลักษณะอันอาจมีผลกระทบต่อสุขภาพด้าน โครงร่างของกระดูกและกล้ามเนื้อ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.4"
  },
  {
    "code": "GPP211",
    "nameTh": "บุคลากรไม่ได้รับคำแนะนำ/อุปกรณ์ในการปรับ การทำงานเพื่อลดผลกระทบต่อ สุขภาพด้านโครงร่างของกระดูกและกล้ามเนื้อ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.4"
  },
  {
    "code": "GPP212",
    "nameTh": "บุคลากรเกิดโรคจากการทำงานเกี่ยวกับโครงร่างกระดูกและกล้ามเนื้อ ซึ่งมีสาเหตุ จาก Biomechanical Hazard",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2.4"
  },
  {
    "code": "GPP301",
    "nameTh": "บุคลากรไม่ได้ตรวจสุขภาพก่อนการรับเข้าทำงาน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P3.1"
  },
  {
    "code": "GPP302",
    "nameTh": "บุคลากรได้รับการตรวจสุขภาพประจำปี ซึ่งมีโปรแกรมการตรวจไม่ครบถ้วน เหมาะสม ตรงตามลักษณะงาน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P3.2"
  },
  {
    "code": "GPP303",
    "nameTh": "บุคลากรที่มีโอกาสแพร่กระจายเชื้อต่างๆ มาทำงานโดยไม่ป้องกันและควบคุม",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P3.2"
  },
  {
    "code": "GPL101",
    "nameTh": "อุปกรณ์บนรถพยาบาลไม่พร้อมใช้ ไม่เหมาะสมและไม่ปลอดภัยสำหรับการส่งต่อ ผู้ป่วย",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L1.1"
  },
  {
    "code": "GPL102",
    "nameTh": "บุคคลากรที่เกิดอุบัติเหตุจากการคมนาคมหรือการเดินทางโดยระบบขนส่ง สาธารณะระหว่างการปฏิบัติงาน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L1.2"
  },
  {
    "code": "GPL103",
    "nameTh": "บุคลากรเสียชีวิตหรือบาดเจ็บจากการปฏิบัติหน้าที่ระหว่างการส่งต่อผู้ป่วยด้วย รถพยาบาล",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L1.2"
  },
  {
    "code": "GPL104",
    "nameTh": "เกิดอุบัติเหตุของรถพยาบาลระหว่างปฏิบัติหน้าที่",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L1.2"
  },
  {
    "code": "GPL105",
    "nameTh": "พนักงานขับรถมีสภาพไม่พร้อมสมบูรณ์สำหรับการขับรถพยาบาล เช่น พักผ่อน น้อย อายุมาก ดื่มสุรา",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L1.3"
  },
  {
    "code": "GPL106",
    "nameTh": "พนักงานขับรถไม่ปฏิบัติตามแนวทางความปลอดภัยของรถบริการการแพทย์ ฉุกเฉิน และรถพยาบาล เช่น ขับรถเร็วเกินกว่ากำหนด",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L1.3"
  },
  {
    "code": "GPL201",
    "nameTh": "บุคลากรไม่ปฏิบัติตามแนวทางการให้ข้อมูลด้านสุขภาพแก่ผู้รับบริการ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L2.1"
  },
  {
    "code": "GPL202",
    "nameTh": "บุคลากรให้ข้อมูลไม่ครบถ้วนแก่ผู้ป่วยและญาติ",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L2.1"
  },
  {
    "code": "GPL203",
    "nameTh": "บุคลากรบันทึกข้อมูลในเวชระเบียนไม่ครบถ้วน ไม่ถูกต้อง",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L2.2"
  },
  {
    "code": "GPL204",
    "nameTh": "บุคลากรแก้ไขข้อมูลในเวชระเบียนโดยไม่ถูกต้องตามแนวทางและข้อกำหนดตาม กฎหมาย",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L2.2"
  },
  {
    "code": "GPL205",
    "nameTh": "เกิดปัญหาด้านการบริหารจัดการ/การเก็บรักษาเวชระเบียน เช่น เวชระเบียนสูญ หาย ผู้ป่วยคนเดียวมีเวชระเบียนสองฉบับ เป็นต้น",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L2.2"
  },
  {
    "code": "GPE101",
    "nameTh": "อันตรายจากโครงสร้างอาคารสถานที่และสิ่งแวดล้อมเชิงกายภาพ เช่น แสง เสียง ฝุ่นละออง มีเชื้อรา เป็นต้น",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E1"
  },
  {
    "code": "GPE102",
    "nameTh": "ห้องแยกโรค/Isolation room มีการระบายอากาศไม่เหมาะสม และ/หรือ ไม่ เป็นไปตามเกณฑ์มาตรฐาน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E1"
  },
  {
    "code": "GPE201",
    "nameTh": "บุคลากรได้รับผลกระทบ Psychosocial factors จากผู้บังคับบัญชา หรือเพื่อน ร่วมงาน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E2"
  },
  {
    "code": "GPE202",
    "nameTh": "บุคลากรไม่มี work-life balance",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E2"
  },
  {
    "code": "GPE203",
    "nameTh": "บรรยากาศในการทำงานและสภาวะแวดล้อมไม่เหมาะสม",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E2"
  },
  {
    "code": "GPE204",
    "nameTh": "บุคคลากรได้ทำงานในตำแหน่งที่ไม่มีความชำนาญ และไม่มีการเตรียมความพร้อม",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E2"
  },
  {
    "code": "GPE205",
    "nameTh": "เกิดปัญหาด้านการจัดการสภาพแวดล้อมในการให้บริการ เช่น ไม่มีป้ายให้ คำแนะนำ/บอกทาง, ไม่มีทางหนีไฟหรือมีแต่ไม่พร้อมใช้/มีสิ่งกีดขวาง, ลิฟต์ ขัดข้อง มีคนติดในลิฟต์ หรือ ลิฟต์ไม่พร้อมใช้งาน/ชำรุด/ติดค้าง เป็นต้น",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E2"
  },
  {
    "code": "GPE206",
    "nameTh": "เกิดปัญหาด้านการควบคุมสิ่งแวดล้อมในสถานที่ทำงาน เช่น ระบบน้ำอุปโภค- บริโภคไม่เพียงพอ/ไม่พร้อมใช้, ระบบไฟฟ้าไม่เพียงพอ ไม่พร้อมใช้/ดับ/ช็อต/ กระพริบ, การบำบัดน้ำเสีย/กำจัดขยะ ไม่ถูกวิธี/ไม่ได้มาตรฐาน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E2"
  },
  {
    "code": "GPE207",
    "nameTh": "เกิดปัญหาความไม่ปลอดภัย/ขาดการปฏิบัติหรือไม่ปฏิบัติตามนโยบายความ ปลอดภัย เช่น ทรัพย์สินสูญหาย/ถูกลักขโมย เป็นต้น",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E2"
  },
  {
    "code": "GPE301",
    "nameTh": "บุคลากรได้รับภัยคุกคามหรือถูกทำร้ายทางวาจาจากบุคคลภายใน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E3"
  },
  {
    "code": "GPE302",
    "nameTh": "บุคลากรได้รับภัยคุกคามหรือถูกทำร้ายทางกายจากบุคคลภายใน",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E3"
  },
  {
    "code": "GPE303",
    "nameTh": "บุคลากรได้รับภัยคุกคามหรือถูกทำร้ายทางวาจาจากผู้ป่วยและญาติหรือ บุคคลภายนอก",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E3"
  },
  {
    "code": "GPE304",
    "nameTh": "บุคลากรได้รับภัยคุกคามหรือถูกทำร้ายทางกายจากผู้ป่วยและญาติหรือ บุคคลภายนอก",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E3"
  },
  {
    "code": "GPE305",
    "nameTh": "เกิดกรณีความไม่สงบในสถานพยาบาล เช่น เมาสุราอาละวาด",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E3"
  },
  {
    "code": "GPO101",
    "nameTh": "เรื่องอื่น ๆ ที่ไม่ใช่ SIMPLE โปรดระบุ ...............................................................",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "-"
  },
  {
    "code": "GOS101",
    "nameTh": "เกิดปัญหาด้านการควบคุมการวางแผน เช่น ไม่มีแผนปฏิบัติการ-แผนไม่ ครอบคลุม/การสื่อสารแผน/การมอบหมายผู้รับผิดชอบ/ไม่กำหนด วัตถุประสงค์ ตอนที่ I-2 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GOS102",
    "nameTh": "เกิดปัญหาด้านการควบคุมกระบวนการปฏิบัติงาน เช่น ไม่กำหนด กระบวนการปฏิบัติงานที่สำคัญ/ขาดการประเมินประสิทธิภาพ/ขาดการ ติดตามผล/ไม่มีการปรับปรุงแก้ไขข้อเสนอแนะ ตอนที่ I-6 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GOS103",
    "nameTh": "เกิดปัญหาด้านการติดตามประเมินผล เช่น ไม่มีการประเมินความคืบหน้า/ ไม่เปรียบเทียบผลการใช้จ่ายเงิน/ไม่แจ้งผลการประเมินให้ทราบ/ไม่ได้ ทบทวนวัตถุประสงค์-แผนและกระบวนการดำเนินงาน ตอนที่ I-4 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S1"
  },
  {
    "code": "GOS201",
    "nameTh": "อาคารสถานที่/พื้นที่ให้บริการ ไม่เหมาะสม/ไม่ปลอดภัย/ไม่ถูกสุขลักษณะ ตอนที่ I-3 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S2"
  },
  {
    "code": "GOS202",
    "nameTh": "ห้องน้ำหรือห้องสุขาไม่พร้อมใช้ (เช่น ชำรุด/กดชักโครกไม่ลง/ส้วมเต็ม/ไม่ พอใช้) หรือไม่สะดวกต่อผู้พิการ ตอนที่ I-3 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S2"
  },
  {
    "code": "GOS301",
    "nameTh": "อันตรายจากภัยธรรมชาติ อุทกภัย อัคคีภัย วาตภัย ตอนที่ II-1 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "S3"
  },
  {
    "code": "GOI101",
    "nameTh": "เกิดปัญหาด้าน Hardware เช่น ไม่มีแผนบริหารจัดการ/ไม่เพียงพอ/ไม่ พร้อมใช้/ใช้ไม่ตรงวัตถุประสงค์/ใช้ผิดวิธี- เทคนิค ตอนที่ I-4 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GOI102",
    "nameTh": "เกิดปัญหาด้าน Network & Security เช่น ไม่พร้อมใช้/ระบบล่ม/มีการ เข้าถึงโดยผู้ไม่มีสิทธิ์ ตอนที่ I-4 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GOI103",
    "nameTh": "เกิดปัญหาด้าน Software เช่น ไม่เข้ากับ hardware/ไม่พร้อมใช้/ไม่ ตอบสนองความต้องการ/ใช้ผิดวิธี-เทคนิค ตอนที่ I-4 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GOI104",
    "nameTh": "เกิดปัญหาด้าน User & IT Team เช่น ไม่มอบหมายผู้รับผิดชอบ/ไม่พร้อม/ ไม่ครอบคลุมบทบาทหน้าที่/ขาดความรู้และทักษะ ตอนที่ I-4 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GOI105",
    "nameTh": "เกิดปัญหาด้านข้อมูล สารสนเทศ เช่น ไม่ถูกต้อง/ไม่ครบถ้วน/ไม่น่าเชื่อถือ/ ไม่เป็นปัจจุบัน ตอนที่ I-4 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GOI106",
    "nameTh": "เกิดปัญหาด้านระบบ/กระบวนการสื่อสาร เช่น ไม่มีแผน/วิธีการหรือช่อง ทางการสื่อสาร, ไม่สื่อสารหรือสื่อสารไม่ต่อเนื่อง/ไม่ครบถ้วน, ขาดการ ติดตามประเมินผลการสื่อสาร ตอนที่ I-3 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I1"
  },
  {
    "code": "GOI201",
    "nameTh": "เกิดปัญหาด้านการควบคุมทรัพย์สิน เช่น ไม่กำหนดระเบียบ/ผู้รับผิดชอบ, ไม่มีทะเบียนคุม/เอกสารหลักฐานกำกับ, ขาดการตรวจสอบหรือสอบทาน ตอนที่ I-1 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I2"
  },
  {
    "code": "GOI202",
    "nameTh": "เกิดปัญหาด้านระบบบริหารการพัสดุ เช่น ไม่กำหนดระเบียบ/แผนความ ต้องการและการจัดหา, ไม่มีทะเบียนคุม/การตรวจรับ/การบำรุงรักษา, ขาด การควบคุมการแจกจ่าย/การจำหน่าย ตอนที่ I-1 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I2"
  },
  {
    "code": "GOI203",
    "nameTh": "เกิดปัญหาด้านการควบคุมการใช้ทรัพยากร เช่น จัดสรรไม่เหมาะสม/ใช้ไม่ คุ้ม-ไม่ถูกตามมาตรฐาน/บุคลากรไม่ปฏิบัติตามข้อกำหนด-ขาดทักษะการใช้ ตอนที่ II-3 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "I2"
  },
  {
    "code": "GOM101",
    "nameTh": "เกิดปัญหาด้านการรับสมัคร บรรจุ แต่งตั้งบุคลากร เช่น ไม่มีการกำหนด กระบวนการคัดเลือก/ทักษะและความสามารถที่จำเป็นกับตำแหน่ง, ไม่มีการ เผยแพร่ข้อมูลการรับสมัคร/การสอบคัดเลือก, ไม่มีคำสั่งเป็นลายลักษณ์อักษรโดย ผู้บริหารสูงสุด ตอนที่ I-5 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M1"
  },
  {
    "code": "GOM102",
    "nameTh": "เกิดปัญหาด้านการบริหารจัดการเกี่ยวกับบุคลากร เช่น ไม่กำหนดหน้าที่ ความรับผิดชอบ/การเปลี่ยนแปลงที่สำคัญเกี่ยวกับการมอบหมายงานเป็น ลายลักษณ์อักษร, ไม่มีการจัดทำแนวทางการปฏิบัติเรื่องค่าตอบแทน, การ เลื่อนขั้นเงินเดือนไม่มีการพิจารณาอนุมัติและจัดทำเป็นลายลักษณ์อักษร ตอนที่ I-5 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M1"
  },
  {
    "code": "GOM103",
    "nameTh": "เกิดปัญหาด้านการพัฒนาบุคลากร เช่น ไม่มีการจัดสรรงบประมาณ/ ทรัพยากร/เครื่องมือ และการจัดฝึกอบรม, ไม่มีการพิจารณาความต้องการ ฝึกอบรมของบุคลากรเพื่อพัฒนาทักษะ ตอนที่ I-5 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M1"
  },
  {
    "code": "GOM201",
    "nameTh": "เกิดปัญหาด้านการควบคุมสภาพแวดล้อมของการดำเนินงาน เช่น เอกสาร กระบวนการดำเนินงานไม่เป็นปัจจุบัน/ไม่มีกฎ ระเบียบ ความรับผิดชอบที่ ชัดเจน/ขาดการติดตามผลและวางแผนป้องกัน ตอนที่ I-6 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "M2"
  },
  {
    "code": "GOP101",
    "nameTh": "เกิดปัญหาด้านการควบคุมภารกิจ เช่น ไม่กำหนดวัตถุประสงค์-เป้าหมาย การดำเนินงาน/ภารกิจไม่ชัดเจนเป็นลายลักษณ์อักษร/ขาดการประกาศ สื่อสารภารกิจ ตอนที่ I-1 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P1"
  },
  {
    "code": "GOP201",
    "nameTh": "เกิดปัญหาด้านกระบวนการบริการ เช่น ไม่มีการกำหนดมาตรฐานขั้นตอน กระบวนการบริการ, ให้บริการไม่ครอบคลุม/ไม่พร้อม/ไม่ตรงตามช่วง ระยะเวลา ตอนที่ I-6 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "P2"
  },
  {
    "code": "GOL101",
    "nameTh": "เกิดปัญหาด้านการควบคุม กำกับดูแลด้านวิชาชีพ เช่น บุคลากรมีคุณสมบัติ ไม่เหมาะสมตามมาตรฐานวิชาชีพ, ละเลยการปฏิบัติหน้าที่ หรือปฏิบัติ หน้าที่โดยไม่ใช้ความรู้ตามหลักวิชาการ, ประพฤติตนและประกอบกิจแห่ง วิชาชีพโดยไม่ถูกต้องตามกฎหมาย ตอนที่ II-2 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L1"
  },
  {
    "code": "GOL102",
    "nameTh": "เกิดเหตุการณ์การทุจริตในหน้าที่ หรือปฏิบัติโดยมีอคติ และ/หรือใช้อำนาจ หน้าที่เพื่อผลประโยชน์ส่วนตน ตอนที่ II-2 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "L1"
  },
  {
    "code": "GOE101",
    "nameTh": "เกิดปัญหาด้านการควบคุมการเงิน เช่น ไม่กำหนดระเบียบ/ผู้รับผิดชอบ, ไม่มี เอกสารหลักฐานกำกับ, ขาดการตรวจสอบหรือสอบทาน เป็นต้น ตอนที่ I-6 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E1"
  },
  {
    "code": "GOE201",
    "nameTh": "เกิดปัญหาด้านการควบคุมงบประมาณ เช่น ไม่กำหนดระเบียบ/ผู้รับผิดชอบ, ไม่มีทะเบียนคุม/เอกสารหลักฐานกำกับ, ขาดการตรวจสอบหรือสอบทาน เป็น ต้น ตอนที่ I-6 /",
    "nameEn": null,
    "clinicalOrGeneral": "General",
    "simpleCategory": "E2"
  }
] as const satisfies readonly NrlsRiskCodeSeed[];

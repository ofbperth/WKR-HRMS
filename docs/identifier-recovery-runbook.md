# Identifier Recovery Runbook

ใช้ runbook นี้เมื่อ environment ใด environment หนึ่งเคย apply migration `20260603120000_data_protection_hardening` ก่อน encrypt legacy `patientHn` / `patientAn`

## เป้าหมาย

- กู้ `hnEncrypted` / `anEncrypted` ให้ครบจาก backup manifest
- ยืนยันว่าไม่มี plaintext HN/AN ค้างอยู่
- ค่อยบังคับ `incident_plaintext_identifiers_must_be_null` กลับหลัง evidence ครบ

## ไฟล์ manifest ที่ต้องเตรียม

รูปแบบ JSON:

```json
{
  "incidents": [
    {
      "id": "incident_id_here",
      "patientHn": "123456",
      "patientAn": "A00123"
    }
  ]
}
```

หมายเหตุ:
- ใช้เฉพาะ incident ที่ backup ยืนยันว่ามี identifier จริง
- ถ้า incident ไม่มี HN/AN เดิม ไม่ต้องใส่ใน manifest
- ควรดึงจาก isolated recovery DB หรือ snapshot เท่านั้น ไม่ควรดึงจาก production ที่ถูก null ไปแล้ว

## ลำดับปฏิบัติจริง

1. Apply corrective migration

```bash
npx prisma migrate deploy
```

2. ดูสถานะ live DB ก่อนเริ่ม recovery

```bash
npm run security:report-identifier-status
```

หรือถ้ามี manifest แล้ว:

```bash
npm run security:report-identifier-status -- --input path/to/manifest.json
```

3. ถ้ายังมีแถวที่ plaintext ยังอยู่ ให้ทำ forward backfill

```bash
npm run security:backfill-sensitive
```

4. ถ้ามีแถว `recoveryRequired` ให้ apply manifest จาก backup

```bash
npm run security:apply-identifier-recovery -- --input path/to/manifest.json
```

5. Verify recovery coverage

```bash
npm run security:verify-identifier-recovery -- --input path/to/manifest.json
```

6. Re-enforce null-only plaintext constraint

```bash
npm run security:enforce-identifier-constraint -- --input path/to/manifest.json
```

## เกณฑ์ผ่านก่อนปิดงาน

- `security:report-identifier-status -- --input ...` ต้องเหลือ `recoveryRequired = 0`
- `security:verify-identifier-recovery` ต้อง exit code 0
- `security:enforce-identifier-constraint` ต้อง exit code 0
- live DB ต้องไม่มี incident ที่ `patientHn` หรือ `patientAn` ยังไม่เป็น `NULL`

## ข้อควรระวัง

- อย่า re-add constraint ก่อน recovery verification ผ่าน
- อย่าใช้ manifest ที่สร้างจาก DB production หลังโดน destructive migration ไปแล้ว
- ถ้าไม่มี backup/snapshot ที่เชื่อถือได้ ต้องถือว่า row นั้น unrecoverable และต้องเปิด incident response แยก

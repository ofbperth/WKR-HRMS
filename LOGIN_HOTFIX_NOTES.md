# Login Hotfix Notes

## Problem
กดปุ่มเข้าสู่ระบบแล้วไม่มี request ไป `/api/auth/login` ใน Network tab และหน้าไม่ redirect

## Root cause
- Login form เดิมพึ่ง `react-hook-form` + custom `<Input />` ที่ไม่ได้ `forwardRef` ทำให้เกิด warning `Function components cannot be given refs` และมีโอกาสไม่ trigger submit/validation ตามที่คาด
- Redirect เดิมใช้ `router.push()` + `router.refresh()` ซึ่งบางครั้ง dev runtime ไม่เปลี่ยนหน้าให้ทันทีหลัง set cookie

## Fix
- เปลี่ยน login form เป็น controlled form แบบ simple React state เพื่อให้ submit แน่นอน
- กำหนด `<Button type="submit">` ชัดเจน
- เปลี่ยน redirect หลัง login สำเร็จเป็น `window.location.assign()`
- แก้ `Input` และ `Button` เป็น `React.forwardRef` เพื่อลด warning และรองรับ React Hook Form/shadcn style

## Expected test
เปิด DevTools > Network แล้วกดเข้าสู่ระบบ ต้องเห็น request:

POST /api/auth/login

ถ้า status 200 ระบบจะ redirect ไป role home เช่น `/admin`

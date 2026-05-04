# Hotfix: bcryptjs TypeScript declaration

Fixes Next.js build error:

`Could not find a declaration file for module 'bcryptjs'`

Change:
- Added `types/bcryptjs.d.ts`

Alternative if preferred:

```powershell
npm install -D @types/bcryptjs
```

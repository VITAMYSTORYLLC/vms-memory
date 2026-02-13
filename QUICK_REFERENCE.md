# 🚀 Quick Reference - VitaMyStory

> **One-page cheat sheet for the most common commands and tasks**

---

## 📌 Most Common Commands

### Open Terminal
- **Mac**: `Control + ~` (or click Terminal tab in VS Code)

### Start Development Server
```bash
npm run dev
```
Then open: http://localhost:3000

### Stop Development Server
- Press `Control + C` in terminal

---

## 🔄 Push Changes to Production

**Every time you make code changes and want them live on your tablet/web:**

```bash
git add .
git commit -m "Description of what you changed"
git push
```

**Wait 1 minute** → Changes are live on Vercel!

---

## 📱 Export Android App (.aab)

**When you need a new build for Google Play:**

```bash
eas build --platform android --profile production
```

**Wait ~10-15 minutes** → Download the .aab file

---

## 🌐 Important URLs

| What | URL |
|------|-----|
| **Production Website** | https://vms-memory.vercel.app/ |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Firebase Console** | https://console.firebase.google.com/ |
| **GitHub Repository** | https://github.com/ulisesbedia-cyber/vms-memory |
| **Expo Dashboard** | https://expo.dev/ |

---

## 🆘 Emergency Commands

### I broke something, go back!
```bash
git status
git restore .
```

### I need to see what changed
```bash
git status
```

### I need to undo my last commit
```bash
git reset --soft HEAD~1
```

---

## 🔧 Common Tasks

### Add a new npm package
```bash
npm install package-name
```

### Build for production (test)
```bash
npm run build
```

### Check if there are errors
```bash
npm run lint
```

---

## 📂 Important Files

| File | What it does |
|------|--------------|
| `app/page.tsx` | Main story writing page |
| `app/lib/firebase.ts` | Firebase configuration |
| `.env.local` | API keys and secrets |
| `next.config.js` | App configuration |
| `package.json` | Lists all dependencies |

---

## 🎯 Quick Workflows

### "I made changes and want them on my tablet"
1. `git add .`
2. `git commit -m "what I changed"`
3. `git push`
4. Wait 1 minute
5. Reload app on tablet

### "I want to test locally"
1. `npm run dev`
2. Open browser to `localhost:3000`
3. Make changes
4. Page auto-refreshes

### "I need to update Firebase config"
1. Open `.env.local`
2. Update the values
3. Save file
4. Restart dev server (`Control+C` then `npm run dev`)

---

**💡 For detailed explanations, see `DEV_GUIDE_FOR_ULISES.md`**

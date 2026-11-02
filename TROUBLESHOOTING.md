# Troubleshooting Guide

## 🚨 **App Not Loading / Blank Screen**

### **Quick Fix:**
1. **Check browser console** (F12 → Console tab)
2. **Look for error messages**
3. **Check if data is loading**

### **Common Issues:**

#### **1. Circular Dependency Error**
```
Error: Cannot access 'mockDB' before initialization
```
**Fix:** This should be resolved now. The mock data has been moved to the dataService.

#### **2. Supabase Configuration Error**
```
Error: Missing Supabase credentials
```
**Fix:** The app now automatically falls back to mock data when Supabase is not configured.

#### **3. Data Not Loading**
```
Loading... (stuck on loading screen)
```
**Fix:** Check browser console for specific errors.

### **Debug Steps:**

1. **Open browser console** (F12)
2. **Look for these messages:**
   - `Using mock data (Supabase not configured)` ✅ Good
   - `Using mock data for [table] (Supabase not configured)` ✅ Good
   - Any red error messages ❌ Problem

3. **Check network tab:**
   - Look for failed requests
   - Check if any API calls are being made

4. **Verify environment variables:**
   ```bash
   # Check if .env.local exists
   ls -la .env.local
   
   # If not, create it
   echo "VITE_USE_SUPABASE=false" > .env.local
   ```

### **Manual Testing:**

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open browser console and look for:**
   ```
   Using mock data (Supabase not configured)
   ```

3. **Check if data loads:**
   - You should see competitions, athletes, etc.
   - Navigation should work
   - Search should work

### **If Still Not Working:**

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Restart the dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

3. **Check for JavaScript errors:**
   - Open browser console
   - Look for any red error messages
   - Take a screenshot and share

### **Expected Behavior:**

✅ **Working correctly:**
- App loads with dark theme
- Shows "Loading..." briefly
- Displays competitions and records
- Navigation works
- Search works
- No console errors

❌ **Not working:**
- Blank white screen
- Stuck on "Loading..."
- Console errors
- No data displayed

### **Still Having Issues?**

1. **Share the browser console output**
2. **Check if the dev server is running** (should show localhost:5173)
3. **Try opening in incognito mode**
4. **Check if all files are saved**

The app should now work with mock data by default, even without Supabase configuration!


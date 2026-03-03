# Default Hostels Setup

This guide explains how to create default hostels in the database for the Hostel Management System.

## 🎯 Purpose

When setting up the system for the first time, you need hostels in the database before you can:
- Assign wardens to hostels
- Allocate rooms to students
- Process hostel applications

## 📋 What Gets Created

Running the seed script creates **8 default hostels**:

### Men's Hostels (4)
1. **Sapphire Block** (SAP) - 50 rooms, 200 capacity
2. **Diamond Block** (DIA) - 45 rooms, 180 capacity
3. **Emerald Block** (EME) - 40 rooms, 160 capacity
4. **Ruby Block** (RUB) - 35 rooms, 140 capacity

### Women's Hostels (4)
1. **Ganga Block** (GAN) - 50 rooms, 200 capacity
2. **Yamuna Block** (YAM) - 45 rooms, 180 capacity
3. **Saraswati Block** (SAR) - 40 rooms, 160 capacity
4. **Kaveri Block** (KAV) - 35 rooms, 140 capacity

**Total Capacity:** 340 rooms for 1,360 students

## 🚀 Quick Start

### Method 1: Using NPM Script (Recommended)

```bash
cd backend
npm run seed:hostels
```

### Method 2: Direct Node Execution

```bash
cd backend
node src/seeds/seedHostels.js
```

## 📖 Step-by-Step Guide

### Step 1: Navigate to Backend Directory
```bash
cd C:\Users\user\OneDrive\Documents\Projects\miniproject2\miniproject2\backend
```

### Step 2: Run the Seed Script
```bash
npm run seed:hostels
```

### Step 3: Confirm the Output
You should see:
```
🔗 Connecting to database...
✅ Database connected.
📊 Checking existing hostels...
🏢 Creating default hostels...

✅ Successfully created hostels:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Sapphire Block (SAP)
   Gender: MALE
   Total Rooms: 50
   Capacity: 200 students
   ...

📈 Summary:
   Total Hostels: 8
   Men's Hostels: 4
   Women's Hostels: 4
   Total Rooms: 340
   Total Capacity: 1360 students

🎉 Hostel seeding completed successfully!
```

### Step 4: Verify in Application
1. Start your backend server: `npm start`
2. Login to Admin dashboard
3. Go to **Wardens** → **Add Warden**
4. Select gender (Male/Female)
5. The hostel dropdown should now show the corresponding hostels

## ⚠️ Important Notes

### If Hostels Already Exist
- The script will ask for confirmation before deleting existing hostels
- Type `yes` or `y` to proceed, `no` to cancel

### Database Connection
- Ensure your database is running before executing the script
- Check `.env` file for correct database credentials

### Before Running
Make sure these are set in your `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hostel_management
DB_PORT=3306
```

## 🔄 Re-running the Script

You can run the script multiple times:
- If hostels exist, you'll be asked to confirm deletion
- Existing wardens assigned to hostels will be unassigned
- All hostel data will be reset to defaults

## 🛠️ Customization

To modify the default hostels, edit:
```
backend/src/seeds/seedHostels.js
```

Example structure:
```javascript
{
  name: "Your Hostel Name",
  blockCode: "CODE",
  gender: "MALE" or "FEMALE",
  totalRooms: 50,
  address: "Location on Campus",
  capacity: 200,
  wardenId: null
}
```

## 🐛 Troubleshooting

### Error: Database connection failed
**Solution:** 
- Check if MySQL/MariaDB is running
- Verify `.env` database credentials

### Error: Table 'Hostels' doesn't exist
**Solution:**
```bash
npm run migrate:sync
```

### Script hangs at "Do you want to delete..."
**Solution:**
- Type `yes` or `no` and press Enter
- For automation, delete hostels manually first

### No hostels showing in dropdown
**Solution:**
1. Check browser console for API errors
2. Verify backend is running: `npm start`
3. Check database: `SELECT * FROM Hostels;`

## 📞 Next Steps After Seeding

1. **Create Wardens:**
   - Go to Admin → Wardens → Add Warden
   - Assign wardens to the newly created hostels

2. **Create Rooms:**
   - Go to Admin → Rooms → Add Room
   - Link rooms to the hostels

3. **Accept Applications:**
   - Students can now apply for these hostels
   - Admin can process applications

## 💡 Tips

- Run this script during initial setup
- Create wardens immediately after seeding hostels
- Use meaningful block codes (3 letters max)
- Keep gender-based separation for traditional campuses
- Adjust room counts based on your campus capacity

## 📝 Summary

```bash
# Quick command to set up default hostels
cd backend && npm run seed:hostels
```

After running this, your hostel management system will have:
✅ 8 hostels (4 male, 4 female)
✅ 340 total rooms
✅ Capacity for 1,360 students
✅ Ready for warden assignments
✅ Ready for student applications

---

**Questions or Issues?**
Check the console output for detailed error messages or verification steps.

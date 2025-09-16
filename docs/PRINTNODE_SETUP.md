# PrintNode Integration Setup Guide

This guide will help you set up PrintNode API integration with your SPA Operations Dashboard for automatic receipt printing.

## Prerequisites

1. **PrintNode Account**: You already have PrintNode set up with your XPrinter 80mm
2. **PrintNode Desktop App**: Running on your local machine with printer connected
3. **API Key**: From your PrintNode account dashboard

## Step 1: Get Your PrintNode Credentials

1. **Login to PrintNode Dashboard**: Go to https://app.printnode.com
2. **Get API Key**: 
   - Go to "Account" → "API Keys"
   - Create a new API key or copy existing one
3. **Get Printer ID**:
   - Go to "Printers" section
   - Find your XPrinter 80mm
   - Copy the Printer ID (usually a number like 12345)

## Step 2: Configure Environment Variables

### Option A: Using .env.local file (Recommended)

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your PrintNode credentials:
   ```env
   VITE_PRINTNODE_API_KEY=your-actual-api-key-here
   VITE_PRINTNODE_PRINTER_ID=your-actual-printer-id-here
   ```

### Option B: Using the UI (Alternative)

1. Start your webapp: `npm run dev`
2. Click on your user menu (top right)
3. Click "Print Settings"
4. Enter your API key and Printer ID
5. Click "Test Connection" to verify
6. Click "Save"

## Step 3: Test the Integration

1. **Start a Session**:
   - Go to Daily Operations
   - Click "Start Session" on any available therapist
   - Complete the session setup process
   - When you click "Start Session", a receipt should automatically print

2. **Verify Print Settings**:
   - Check the user menu for a green dot next to "Print Settings" (indicates PrintNode is configured)
   - If red/gray, click "Print Settings" to configure

## Step 4: Troubleshooting

### Common Issues

1. **"PrintNode not configured" error**:
   - Check your environment variables are set correctly
   - Restart your development server after changing .env.local

2. **"Printer not found" error**:
   - Verify your Printer ID is correct
   - Ensure PrintNode Desktop app is running
   - Check printer is online in PrintNode dashboard

3. **"API Key invalid" error**:
   - Verify your API key is correct
   - Check API key has proper permissions

4. **Receipt not printing**:
   - Check PrintNode Desktop app is running
   - Verify printer is connected and online
   - Check printer has paper loaded
   - Look at PrintNode Desktop app logs for errors

### Debug Steps

1. **Test Connection**:
   - Use the "Test Connection" button in Print Settings
   - Check browser console for detailed error messages

2. **Check PrintNode Desktop**:
   - Ensure it's running and connected
   - Check if printer shows as "online"
   - Look at the activity log for any errors

3. **Verify Printer**:
   - Test print from PrintNode dashboard
   - Check printer has paper and is powered on

## Receipt Format

The generated receipt includes:
- **Header**: Business name and receipt title
- **Session Details**: ID, date, time, room, therapists
- **Service Info**: Description, duration
- **Pricing**: Service price, discount (if any), total
- **Payout Info**: Lady payout, shop revenue
- **Footer**: Thank you message

## Security Notes

- **API Key**: Keep your PrintNode API key secure
- **Environment Variables**: Never commit .env.local to version control
- **Network**: PrintNode API calls are made from the browser (client-side)

## Support

- **PrintNode Support**: https://www.printnode.com/support
- **API Documentation**: https://www.printnode.com/docs/api
- **Desktop App**: Download from PrintNode website if needed

## Features

- ✅ **Automatic Printing**: Receipts print automatically when sessions start
- ✅ **80mm Format**: Optimized for thermal printers
- ✅ **Error Handling**: Graceful fallback if printing fails
- ✅ **Configuration UI**: Easy setup through user interface
- ✅ **Connection Testing**: Verify setup before using
- ✅ **Status Indicators**: Visual feedback on PrintNode status

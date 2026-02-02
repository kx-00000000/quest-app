# Deploying Quest App to Vercel

This guide explains how to deploy your **Quest** application to Vercel.

## Important Note on Data
Currently, this application uses **LocalStorage** to save your Plans and Logs.
- Data is saved **in your browser**.
- Data is **NOT shared** between devices.
- If you deploy to Vercel and open it on your phone, you will start with **empty data**. Your PC data will remain on your PC.

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Vercel](https://vercel.com/) account.
- Your project pushed to a GitHub repository.

## Step 1: Push to GitHub
If you haven't pushed your code to GitHub yet, run the following commands in your terminal (VS Code):

```bash
# 1. Initialize Git (if not done)
git init

# 2. Add all files
git add .

# 3. Commit changes
git commit -m "Ready for deployment"

# 4. Create a repository on GitHub and link it
# (Replace YOUR_REPO_URL with your actual repository URL)
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

## Step 2: Import into Vercel
1.  Log in to your **Vercel Dashboard**.
2.  Click **"Add New..."** -> **"Project"**.
3.  Find your `quest` repository in the list and click **"Import"**.

## Step 3: Configure Project
Vercel will detect it's a Next.js project automatically.

**⚠️ CRITICAL: Environment Variables**
You MUST add the Supabase keys from your `.env.local` to Vercel, otherwise the build might fail (or future features won't work).

1.  Expand the **"Environment Variables"** section.
2.  Add the following keys (copy values from your local `.env.local` file):

    | Key | Value |
    | --- | --- |
    | `NEXT_PUBLIC_SUPABASE_URL` | `https://rvlkjzvktcpieyoznvox.supabase.co` |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Copy the long key from your .env.local file)* |

3.  Click **"Deploy"**.

## Step 4: Verification
- Wait for the build to complete (usually 1-2 minutes).
- Once finished, you will get a live URL (e.g., `quest-app.vercel.app`).
- Open it on your phone or PC to test!

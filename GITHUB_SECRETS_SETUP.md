# GitHub Secrets Setup Guide

## 🔐 Required Secrets for Automated Deployment

To enable GitHub Actions to deploy automatically to your server, you need to configure the following secrets in your repository.

---

## 📋 Step-by-Step Setup

### Step 1: Navigate to Repository Settings

1. Go to: https://github.com/mesfer-Jaz/V-Digital-COO
2. Click **Settings** (top menu)
3. Click **Secrets and variables** (left sidebar)
4. Click **Actions**
5. Click **New repository secret**

### Step 2: Add Required Secrets

Add the following 4 secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SERVER_HOST` | `72.60.178.47` | Your server IP address |
| `SERVER_USER` | `ubuntu` | SSH username |
| `SERVER_PORT` | `22` | SSH port (usually 22) |
| `SSH_PRIVATE_KEY` | (your private key) | SSH private key for authentication |

---

## 🔑 Getting Your SSH Private Key

### Option A: Use Existing Key

If you already have SSH access to the server:

```bash
# On your local machine
cat ~/.ssh/id_rsa
```

Copy the entire content including:
```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

### Option B: Generate New Key

```bash
# Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@xcircle.co" -f ~/.ssh/github_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy.pub ubuntu@72.60.178.47

# Get private key for GitHub secret
cat ~/.ssh/github_deploy
```

---

## 📝 Adding Each Secret

### 1. SERVER_HOST

- **Name:** `SERVER_HOST`
- **Value:** `72.60.178.47`
- Click **Add secret**

### 2. SERVER_USER

- **Name:** `SERVER_USER`
- **Value:** `ubuntu`
- Click **Add secret**

### 3. SERVER_PORT

- **Name:** `SERVER_PORT`
- **Value:** `22`
- Click **Add secret**

### 4. SSH_PRIVATE_KEY

- **Name:** `SSH_PRIVATE_KEY`
- **Value:** (paste your entire private key)
- Click **Add secret**

---

## ✅ Verification

After adding all secrets, your repository should have:

```
Repository secrets (4)
├── SERVER_HOST
├── SERVER_PORT
├── SERVER_USER
└── SSH_PRIVATE_KEY
```

---

## 🚀 Triggering Deployment

After setting up secrets, deployment will automatically trigger when:

1. **Push to main/master branch**
2. **Manual trigger** via Actions tab → "Deploy XCircle Digital COO" → "Run workflow"

---

## 🔧 Server Preparation

Before first deployment, ensure your server has:

```bash
# SSH into server
ssh ubuntu@72.60.178.47

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (if not installed)
sudo npm install -g pm2

# Create project directory
mkdir -p ~/clawdbot
cd ~/clawdbot

# Create .env file with your API keys
nano .env
```

---

## 📞 Support

If deployment fails:

1. Check **Actions** tab for error logs
2. Verify all secrets are correctly set
3. Ensure server is accessible via SSH
4. Check server has Node.js and PM2 installed

---

**Last Updated:** January 28, 2024

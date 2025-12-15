# Docker Setup Guide - Expense Tracker

Complete guide for running the Expense Tracker application using Docker.

## Prerequisites

- **Docker Desktop** installed ([Download here](https://www.docker.com/products/docker-desktop/))
- **Docker Compose** (included with Docker Desktop)

## Quick Start

### 1. Environment Setup

**Backend** - Copy and configure:
```bash
cd backend
cp .env.example .env
# Edit .env and add your actual values
```

**Frontend** - Copy and configure:
```bash
cd frontend
cp .env.example .env
# Edit .env if needed (default should work)
```

### 2. Start All Services

**Development Mode**:
```bash
# From project root
docker-compose up --build
```

This will start:
- MongoDB on `localhost:27017`
- Backend API on `localhost:5000`
- Frontend on `localhost:5173`

**Production Mode**:
```bash
docker-compose -f docker-compose.prod.yml up --build
```

This will start:
- MongoDB (internal only)
- Backend API on `localhost:5000`
- Frontend on `localhost:80`

### 3. Access the Application

- **Development**: http://localhost:5173
- **Production**: http://localhost

## Docker Commands

### Start Services
```bash
# Start in foreground
docker-compose up

# Start in background (detached)
docker-compose up -d

# Rebuild and start
docker-compose up --build
```

### Stop Services
```bash
# Stop containers
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Check Status
```bash
# List running containers
docker-compose ps

# View resource usage
docker stats
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

## Service Details

### MongoDB
- **Image**: mongo:7.0
- **Port**: 27017
- **Data**: Persisted in Docker volume `mongodb_data`
- **Database**: expense-tracker

### Backend
- **Base**: Node.js 20 Alpine
- **Port**: 5000
- **Hot Reload**: Enabled in development mode
- **Environment**: Configured via `.env` file

### Frontend
- **Development**: Vite dev server
- **Production**: Nginx serving static files
- **Port**: 5173 (dev) / 80 (prod)
- **Hot Reload**: Enabled in development mode

## Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb://mongodb:27017/expense-tracker
JWT_SECRET=your_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_client_id
GEMINI_API_KEY=your_gemini_key
PORT=5000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## Development Workflow

### Making Code Changes

**Backend**:
1. Edit files in `backend/` directory
2. Changes auto-reload (nodemon)
3. No need to rebuild container

**Frontend**:
1. Edit files in `frontend/` directory
2. Changes auto-reload (Vite HMR)
3. No need to rebuild container

### Installing New Dependencies

**Backend**:
```bash
# Stop containers
docker-compose down

# Add dependency to package.json or run:
cd backend
npm install package-name

# Rebuild and start
docker-compose up --build
```

**Frontend**:
```bash
# Same process as backend
cd frontend
npm install package-name
docker-compose up --build
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :5173
netstat -ano | findstr :27017

# Kill the process or change ports in docker-compose.yml
```

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Ensure MONGO_URI uses 'mongodb' hostname, not 'localhost'
```

### Container Won't Start
```bash
# View logs for errors
docker-compose logs -f

# Remove all containers and volumes, start fresh
docker-compose down -v
docker-compose up --build
```

### Changes Not Reflecting
```bash
# Rebuild containers
docker-compose up --build

# Clear Docker cache
docker-compose build --no-cache
```

### Permission Issues (Linux/Mac)
```bash
# Fix node_modules permissions
sudo chown -R $USER:$USER backend/node_modules
sudo chown -R $USER:$USER frontend/node_modules
```

## Data Persistence

### MongoDB Data
- Stored in Docker volume: `mongodb_data`
- Persists between container restarts
- To backup:
  ```bash
  docker-compose exec mongodb mongodump --out /data/backup
  ```

### Removing All Data
```bash
# WARNING: This deletes all database data
docker-compose down -v
```

## Production Deployment

### Using Production Compose File
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Differences from Development
- Frontend served by Nginx (optimized)
- No hot reload
- Smaller image sizes
- Production-ready configurations

## Useful Commands

```bash
# Enter a running container
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mongodb mongosh

# View container resource usage
docker stats

# Clean up unused Docker resources
docker system prune -a

# List all volumes
docker volume ls

# Remove specific volume
docker volume rm expense-tracker_mongodb_data
```

## Next Steps

1. Configure your `.env` files with actual credentials
2. Run `docker-compose up --build`
3. Access the app at http://localhost:5173
4. Create an account and test all features
5. For production, use `docker-compose.prod.yml`

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure Docker Desktop is running
4. Try rebuilding: `docker-compose up --build`

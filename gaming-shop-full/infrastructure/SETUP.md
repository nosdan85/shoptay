# ==============================================
# Server Setup Guide
# ==============================================

## Prerequisites

- Ubuntu 22.04 LTS (recommended) or similar
- Docker 24.0+
- Docker Compose 2.20+
- Domain name configured with DNS A records:
  - nosdan.store → server IP
  - api.nosdan.store → server IP

## Server Setup

1. **Install Docker**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

2. **Install Docker Compose**
```bash
sudo apt-get install docker-compose-plugin
```

3. **Clone the repository**
```bash
git clone https://github.com/your-org/nosmarket.git /opt/nosmarket
cd /opt/nosmarket
```

4. **Create environment file**
```bash
cp .env.example .env
nano .env  # Edit with production values
```

5. **Generate SSL certificates**

Using Let's Encrypt (recommended for production):
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d nosdan.store -d api.nosdan.store
sudo cp /etc/letsencrypt/live/nosdan.store/fullchain.pem infrastructure/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/nosdan.store/privkey.pem infrastructure/nginx/ssl/key.pem
sudo cp /etc/letsencrypt/live/nosdan.store/chain.pem infrastructure/nginx/ssl/ca.pem
sudo openssl dhparam -out infrastructure/nginx/ssl/dhparam.pem 2048
sudo chown -R $USER:$USER infrastructure/nginx/ssl/
```

6. **Deploy**
```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

7. **Verify deployment**
```bash
curl -f https://nosdan.store/health
curl -f https://api.nosdan.store/health
docker compose -f docker-compose.prod.yml ps
```

## Monitoring Setup

1. **Setup Prometheus**
```bash
docker volume create prometheus_data
docker run -d --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/infrastructure/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
  -v prometheus_data:/prometheus \
  prom/prometheus
```

2. **Setup Grafana**
```bash
docker volume create grafana_data
docker run -d --name grafana \
  -p 3000:3000 \
  -v grafana_data:/var/lib/grafana \
  grafana/grafana
```

## Backup Strategy

1. **Database backup**
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres nosmarket > backup_$(date +%Y%m%d).sql
```

2. **Automated backups with cron**
```bash
# Add to crontab
0 2 * * * docker compose -f /opt/nosmarket/docker-compose.prod.yml exec -T postgres pg_dump -U postgres nosmarket | gzip > /backups/nosmarket_$(date +\%Y\%m\%d).sql.gz
```

## Troubleshooting

1. **Check logs**
```bash
docker compose -f docker-compose.prod.yml logs -f [service]
```

2. **Restart a service**
```bash
docker compose -f docker-compose.prod.yml restart [service]
```

3. **Full rebuild**
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

4. **Database migrations**
```bash
docker compose -f docker-compose.prod.yml exec api npm run db:push
```

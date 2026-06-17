---
status: open
---

# Verify Docker build end-to-end on Portainer host

The Dockerfile + docker-compose.yml have not yet been built/run on a Docker host. Before deploying to Portainer:

- `docker build -t nook .` should succeed
- `docker run -p 3000:3000 -v $PWD/config:/config:ro nook` should serve the dashboard
- Healthcheck should pass (it relies on `wget` being in `node:24-alpine` — verify; if not, swap for `node -e` ping)
- Push to a registry the Portainer host can pull from, or build on the host

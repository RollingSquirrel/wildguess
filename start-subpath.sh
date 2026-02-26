#!/bin/bash
# Helper script to start Wildguess at a subpath (/wildguess/)
# using the example docker-compose override.

echo "Starting Wildguess at subpath /wildguess/ ..."
docker compose -f docker-compose.yml -f docker-compose.subpath.yml up -d --build
echo ""
echo "App will be available at: http://localhost:8080/wildguess/"

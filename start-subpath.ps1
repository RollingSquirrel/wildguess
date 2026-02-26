# Helper script to start Wildguess at a subpath (/wildguess/)
# using the example docker-compose override.

Write-Host "Starting Wildguess at subpath /wildguess/ ..."
docker compose -f docker-compose.yml -f docker-compose.subpath.yml up -d --build
Write-Host ""
Write-Host "App will be available at: http://localhost:8080/wildguess/"

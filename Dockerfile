# Packages the production build output (dist/) produced by CI.
# Build context = the extracted CI artifact (contains dist/ and this Dockerfile).
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1

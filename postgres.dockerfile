# Same major version as the postgres:latest image this replaces (pin explicitly so a
# future rebuild can't silently jump major versions against the existing data volume).
# Alpine base instead of the default Debian one: far fewer OS packages means far fewer
# CVEs to carry around. Alpine's own postgresql-pg_cron apk package is built against a
# separate apk-packaged Postgres engine (not this image's /usr/local build), so it's not
# ABI-compatible here — build pg_cron from source against this image's actual pg_config
# instead, in a throwaway build stage so the compiler toolchain doesn't end up shipped.
FROM postgres:18-alpine AS build

RUN apk add --no-cache gcc make musl-dev postgresql-dev git \
    && git clone --branch v1.6.7 --depth 1 https://github.com/citusdata/pg_cron.git /tmp/pg_cron \
    && cd /tmp/pg_cron \
    && make with_llvm=no \
    && make with_llvm=no install

FROM postgres:18-alpine
# Pick up whatever patched package versions Alpine has published since this base image
# was built, so we're not carrying already-fixed CVEs just because the layer is stale.
RUN apk update && apk upgrade --no-cache
COPY --from=build /usr/local/lib/postgresql/pg_cron.so /usr/local/lib/postgresql/pg_cron.so
COPY --from=build /usr/local/share/postgresql/extension/pg_cron* /usr/local/share/postgresql/extension/

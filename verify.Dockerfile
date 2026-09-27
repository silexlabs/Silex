# Rebuild the reproducible reference binary in the pinned environment and compare
# it to the hash published with the release. Exit code 0 = reproducible.
# Usage, with this file as it was in the tag checked, since the build changes between tags:
#   git show v3.9.0:verify.Dockerfile | docker build --build-arg TAG=v3.9.0 -
FROM ubuntu:24.04@sha256:008173c23f95b170204355c12626cb5a965d779a7e1283b09e9cffbb1bf33ca3 AS build
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates xz-utils build-essential pkg-config jq \
    libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev
ARG NODE_VERSION=24.21.0
ARG NODE_SHA256=fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6
RUN curl -fsSLo /tmp/node.tar.xz "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
 && echo "$NODE_SHA256  /tmp/node.tar.xz" | sha256sum -c - \
 && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 --no-same-owner \
 && rm /tmp/node.tar.xz
ARG TAG
RUN git clone --branch "$TAG" --depth 1 https://github.com/silexlabs/Silex /src
WORKDIR /src
RUN npm i -g "$(jq -r .packageManager package.json)"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --default-toolchain none -y
ENV PATH=/root/.cargo/bin:$PATH
RUN ./scripts/set-version.sh "${TAG#v}"
RUN . scripts/repro-env.sh \
 && pnpm install --frozen-lockfile --filter @silexlabs/silex --filter @silexlabs/silex-desktop --filter @silexlabs/silex-desktop-dashboard \
 && pnpm build:desktop \
 && pin_embedded_mtimes \
 && cargo build --release --locked --manifest-path desktop/src-tauri/Cargo.toml
ARG EXPECTED=
RUN REBUILT=$(sha256sum target/release/silex-desktop | cut -d' ' -f1); echo "rebuilt: $REBUILT"; \
 EXP="$EXPECTED"; [ -n "$EXP" ] || EXP=$(curl -fsL "https://github.com/silexlabs/Silex/releases/download/$TAG/SHA256SUMS.inner" | cut -d' ' -f1) || true; \
 if [ -z "$EXP" ]; then echo "no published hash yet - reference build"; \
 elif [ "$REBUILT" = "$EXP" ]; then echo "REPRODUCIBLE OK"; \
 else echo "MISMATCH (expected $EXP)"; exit 1; fi

FROM scratch AS export
COPY --from=build /src/target/release/silex-desktop /silex-desktop

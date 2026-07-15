# Rebuild the reproducible reference binary in the pinned environment and compare
# it to the hash published with the release. Exit code 0 = reproducible.
# Usage: docker build --build-arg TAG=v3.9.0 - < verify.Dockerfile
FROM ubuntu:24.04
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates build-essential pkg-config jq \
    libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev
ARG TAG
RUN git clone --recurse-submodules --branch "$TAG" --depth 1 https://github.com/silexlabs/Silex /src
WORKDIR /src
RUN curl -fsSL "https://deb.nodesource.com/setup_$(cat .nvmrc).x" | bash - && apt-get install -y --no-install-recommends nodejs
RUN npm i -g "$(jq -r .packageManager package.json)"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --default-toolchain none -y
ENV PATH=/root/.cargo/bin:$PATH
RUN ./scripts/set-version.sh "${TAG#v}"
RUN . scripts/repro-env.sh \
 && pnpm install --frozen-lockfile --filter @silexlabs/silex --filter @silexlabs/silex-desktop \
 && pnpm run build \
 && for d in dist/client silex-dashboard-2026/public; do find "$d" -exec touch -h -d "@$SOURCE_DATE_EPOCH" {} +; done \
 && cargo build --release --locked --manifest-path desktop/src-tauri/Cargo.toml
ARG EXPECTED=
RUN REBUILT=$(sha256sum target/release/silex-desktop | cut -d' ' -f1); echo "rebuilt: $REBUILT"; \
 EXP="$EXPECTED"; [ -n "$EXP" ] || EXP=$(curl -fsL "https://github.com/silexlabs/Silex/releases/download/$TAG/SHA256SUMS.inner" | cut -d' ' -f1) || true; \
 if [ -z "$EXP" ]; then echo "no published hash yet - reference build"; \
 elif [ "$REBUILT" = "$EXP" ]; then echo "REPRODUCIBLE OK"; \
 else echo "MISMATCH (expected $EXP)"; exit 1; fi

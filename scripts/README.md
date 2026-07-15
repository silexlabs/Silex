# Release verification scripts

Tools to independently verify a Silex Desktop Linux release: that the published
binary was built from this source, and that auto-updates are signed by the
project's key. Linux only; macOS and Windows are out of scope.

## Reproducible build — does the binary match the source?

Linux binaries (appimage/deb/rpm) are reproducible: the compiled binary can be
rebuilt from a tag and matched byte-for-byte against the release's
`SHA256SUMS.inner`, without trusting our CI.

```bash
git clone --recurse-submodules https://github.com/silexlabs/Silex && cd Silex
git checkout v3.9.0   # the tag of the release you are verifying
docker build --build-arg TAG=v3.9.0 - < verify.Dockerfile
```

`REPRODUCIBLE OK` (docker build exit code 0) means your rebuild produced the same binary as the release.

What makes it reproducible:
- `verify.Dockerfile` pins the build environment (same one CI uses for the reference hash).
- `rust-toolchain.toml` pins the Rust compiler.
- `Cargo.lock` + `pnpm-lock.yaml` pin every dependency (`--locked`, `--frozen-lockfile`).
- `repro-env.sh` pins `SOURCE_DATE_EPOCH`, remaps build paths out of the binary,
  disables incremental compilation, forces UTC/C locale.
- `build-desktop-repro.sh` (the release build entry point) also normalizes the
  mtimes of the embedded frontend assets, which `rust-embed` bakes into the binary.

The reproducible unit is the **compiled binary** (`silex-desktop`), in
`SHA256SUMS.inner`. The installers wrap a copy Tauri stamps with its bundle type,
and the wrapper formats vary across `mksquashfs`/`dpkg`/`rpmbuild` — so
verification targets the binary, not the installer. `SHA256SUMS` covers the
installers for download integrity.

## Auto-update — is the update signed by the project?

The in-app updater only installs packages signed by the private key matching the
public key embedded in `desktop/src-tauri/tauri.conf.json`. This checks that the
published update feed is signed by that key (the same check the app runs):

```bash
./scripts/verify-update-signature.sh            # checks releases/latest
```

Requires `rsign` (`cargo install rsign2`) or `minisign`, plus `jq` and `curl`.

## Scripts

| Script | Purpose |
|--------|---------|
| `verify.Dockerfile` (repo root) | Rebuild the tag in the pinned environment and compare to `SHA256SUMS.inner` |
| `verify-update-signature.sh` | Verify the update feed's signature against the embedded key |
| `build-desktop-repro.sh` | Produce the release build deterministically (used by CI) |
| `repro-env.sh` | Deterministic build environment (sourced by the above) |

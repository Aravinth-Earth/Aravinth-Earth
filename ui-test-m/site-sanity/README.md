# Maestro web sanity tests

## Basic sanity

```powershell
maestro test ui-test-m\site-sanity\sanity-homepage.yaml
```

## Proof capture (success path)

```powershell
maestro test ui-test-m\site-sanity\sanity-proof-success.yaml --test-output-dir ui-test-m\site-sanity\artifacts --debug-output ui-test-m\site-sanity\debug
```

## Proof capture (failure path demo)

```powershell
maestro test ui-test-m\site-sanity\sanity-proof-failure-demo.yaml --test-output-dir ui-test-m\site-sanity\artifacts --debug-output ui-test-m\site-sanity\debug
```

## What gets captured

1. Explicit `takeScreenshot` checkpoints in the flow (for success and pre-failure state).
2. Automatic failure artifacts in debug output.
3. Optional video recording commands exist, but web runs can produce empty video frames in this environment.

## Notes

1. Web support in Maestro is currently marked Beta by the CLI.
2. Element-only screenshot cropping is not a built-in Maestro feature; capture is page/viewport level.


# Eval run 20261026-171641

2026-10-26T17:25:37.063Z · 168 manifest entries

## Split: all

| Config | n | Species top-1 | Species top-3 | Genus top-1 | Abstention (non-plants) | False abstention | Schema valid | Latency p50 / p95 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| two-stage__qwen2.5vl-7b__top3 | 28 | 72.0% (18/25) | 76.0% (19/25) | 80.0% (20/25) | 66.7% (2/3) | 0.0% (0/25) | 100.0% (28/28) | 9.9 s / 10.9 s |
| single__qwen2.5vl-7b__top3 | 28 | 76.0% (19/25) | 80.0% (20/25) | 80.0% (20/25) | 100.0% (3/3) | 4.0% (1/25) | 100.0% (28/28) | 7.2 s / 9.1 s |

## Split: non-plant

| Config | n | Abstained | Schema valid | Latency p50 / p95 |
|---|---:|---:|---:|---:|
| two-stage__qwen2.5vl-7b__top3 | 3 | 66.7% (2/3) | 100.0% (3/3) | 1.5 s / 9.3 s |
| single__qwen2.5vl-7b__top3 | 3 | 100.0% (3/3) | 100.0% (3/3) | 1.3 s / 1.4 s |

## Split: public

| Config | n | Species top-1 | Species top-3 | Genus top-1 | Abstention (non-plants) | False abstention | Schema valid | Latency p50 / p95 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| two-stage__qwen2.5vl-7b__top3 | 25 | 72.0% (18/25) | 76.0% (19/25) | 80.0% (20/25) | – | 0.0% (0/25) | 100.0% (25/25) | 10.1 s / 11.0 s |
| single__qwen2.5vl-7b__top3 | 25 | 76.0% (19/25) | 80.0% (20/25) | 80.0% (20/25) | – | 4.0% (1/25) | 100.0% (25/25) | 7.4 s / 9.1 s |

## Latency by stage (all images)

**two-stage__qwen2.5vl-7b__top3**

| Stage | n | p50 / p95 |
|---|---:|---:|
| classify | 28 | 3.2 s / 3.5 s |
| describe | 26 | 6.9 s / 7.9 s |

**single__qwen2.5vl-7b__top3**

| Stage | n | p50 / p95 |
|---|---:|---:|
| single | 28 | 7.2 s / 9.1 s |

## Calibration (all plant images)

Top-1 confidence against species top-1 accuracy. The threshold table shows how many answers remain, and how accurate they are, if the app only shows a single answer at or above that confidence.

### two-stage__qwen2.5vl-7b__top3

ECE: 0.128

| Confidence | n | Mean confidence | Accuracy |
|---|---:|---:|---:|
| 0.0–0.1 | 0 | – | – |
| 0.1–0.2 | 0 | – | – |
| 0.2–0.3 | 0 | – | – |
| 0.3–0.4 | 0 | – | – |
| 0.4–0.5 | 0 | – | – |
| 0.5–0.6 | 0 | – | – |
| 0.6–0.7 | 2 | 60.0% | 50.0% |
| 0.7–0.8 | 5 | 70.0% | 20.0% |
| 0.8–0.9 | 1 | 80.0% | 100.0% |
| 0.9–1.0 | 17 | 90.0% | 88.2% |

| Threshold | Coverage | Accuracy |
|---|---:|---:|
| ≥ 0.0 | 100.0% | 72.0% |
| ≥ 0.1 | 100.0% | 72.0% |
| ≥ 0.2 | 100.0% | 72.0% |
| ≥ 0.3 | 100.0% | 72.0% |
| ≥ 0.4 | 100.0% | 72.0% |
| ≥ 0.5 | 100.0% | 72.0% |
| ≥ 0.6 | 100.0% | 72.0% |
| ≥ 0.7 | 92.0% | 73.9% |
| ≥ 0.8 | 72.0% | 88.9% |
| ≥ 0.9 | 68.0% | 88.2% |

### single__qwen2.5vl-7b__top3

ECE: 0.140

| Confidence | n | Mean confidence | Accuracy |
|---|---:|---:|---:|
| 0.0–0.1 | 0 | – | – |
| 0.1–0.2 | 0 | – | – |
| 0.2–0.3 | 0 | – | – |
| 0.3–0.4 | 0 | – | – |
| 0.4–0.5 | 0 | – | – |
| 0.5–0.6 | 0 | – | – |
| 0.6–0.7 | 0 | – | – |
| 0.7–0.8 | 1 | 70.0% | 100.0% |
| 0.8–0.9 | 1 | 80.0% | 100.0% |
| 0.9–1.0 | 22 | 90.2% | 77.3% |

| Threshold | Coverage | Accuracy |
|---|---:|---:|
| ≥ 0.0 | 100.0% | 79.2% |
| ≥ 0.1 | 100.0% | 79.2% |
| ≥ 0.2 | 100.0% | 79.2% |
| ≥ 0.3 | 100.0% | 79.2% |
| ≥ 0.4 | 100.0% | 79.2% |
| ≥ 0.5 | 100.0% | 79.2% |
| ≥ 0.6 | 100.0% | 79.2% |
| ≥ 0.7 | 100.0% | 79.2% |
| ≥ 0.8 | 95.8% | 78.3% |
| ≥ 0.9 | 91.7% | 77.3% |

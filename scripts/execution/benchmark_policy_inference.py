#!/usr/bin/env python3
"""Benchmark tactical Q-network: mean/p99 forward latency (PyTorch vs optional ONNX Runtime)."""

from __future__ import annotations

import argparse
import time
from pathlib import Path

import numpy as np
import torch

from prob_desk.execution.policy_net import QNetwork
from prob_desk.execution.rollout import default_weights_path, load_q_network


def benchmark_pytorch(q: QNetwork, n: int, batch: int, device: torch.device) -> dict:
    q.eval()
    times: list[float] = []
    x = torch.randn(batch, 6, device=device)
    for _ in range(10):
        with torch.no_grad():
            _ = q(x)
    for _ in range(n):
        t0 = time.perf_counter()
        with torch.no_grad():
            _ = q(x)
        times.append(time.perf_counter() - t0)
    arr = np.array(times) * 1000.0
    return {
        "backend": "pytorch",
        "n": n,
        "batch": batch,
        "mean_ms": float(arr.mean()),
        "p99_ms": float(np.percentile(arr, 99)),
        "throughput_sps": float(n / max(1e-9, arr.sum() / 1000.0)),
    }


def benchmark_onnx(onnx_path: Path, n: int, batch: int) -> dict | None:
    try:
        import onnxruntime as ort
    except ImportError:
        return None
    if not onnx_path.is_file():
        return None
    sess = ort.InferenceSession(
        str(onnx_path),
        providers=["CPUExecutionProvider"],
    )
    name = sess.get_inputs()[0].name
    x = np.random.randn(batch, 6).astype(np.float32)
    for _ in range(10):
        sess.run(None, {name: x})
    times: list[float] = []
    for _ in range(n):
        t0 = time.perf_counter()
        sess.run(None, {name: x})
        times.append(time.perf_counter() - t0)
    arr = np.array(times) * 1000.0
    return {
        "backend": "onnxruntime",
        "n": n,
        "batch": batch,
        "mean_ms": float(arr.mean()),
        "p99_ms": float(np.percentile(arr, 99)),
        "throughput_sps": float(n / max(1e-9, arr.sum() / 1000.0)),
    }


def export_onnx_example(weights: Path, out: Path) -> None:
    q = load_q_network(weights)
    q.eval()
    dummy = torch.randn(1, 6)
    kwargs = dict(
        input_names=["obs"],
        output_names=["qvalues"],
        opset_version=17,
    )
    try:
        torch.onnx.export(q, dummy, str(out), dynamo=False, **kwargs)
    except TypeError:
        torch.onnx.export(q, dummy, str(out), **kwargs)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--weights", type=Path, default=None)
    p.add_argument("--n", type=int, default=2000)
    p.add_argument("--batch", type=int, default=1)
    p.add_argument("--export-onnx", type=Path, default=None)
    args = p.parse_args()

    path = args.weights or default_weights_path()
    if not path.is_file():
        print(f"No weights at {path}; train first.")
        return

    device = torch.device("cpu")
    q = load_q_network(path, device=device)
    print(benchmark_pytorch(q, args.n, args.batch, device))

    if args.export_onnx:
        export_onnx_example(path, args.export_onnx)
        print("Exported ONNX to", args.export_onnx)
        ob = benchmark_onnx(args.export_onnx, args.n, args.batch)
        if ob:
            print(ob)
        else:
            print("ONNX benchmark skipped (missing file or onnxruntime).")


if __name__ == "__main__":
    main()
